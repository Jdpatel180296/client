// client/src/pages/EventsPage.jsx
import React, { useEffect, useState, useRef } from "react";

// Format an ISO datetime or date for display. If value is not parseable,
// return it as-is (so debugging strings still show).
function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  try {
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (err) {
    return d.toLocaleString();
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [eventsRangeLabel, setEventsRangeLabel] = useState("");
  const [flags, setFlags] = useState({});
  const [botStatus, setBotStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const pollers = useRef({});

  useEffect(() => {
    loadEvents();
    loadFlags();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const r = await fetch("/api/events");
      const j = await r.json();
      // Server already filters to next 2 months; show all returned events
      const now = new Date();
      const twoMonthsAhead = new Date(now);
      twoMonthsAhead.setMonth(twoMonthsAhead.getMonth() + 2);

      // human readable range label
      const rangeLabel = `${now.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
      })} – ${twoMonthsAhead.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
      setEventsRangeLabel(rangeLabel);

      setEvents(j || []);
    } catch (err) {
      console.error("Error loading events:", err);
    }
    setLoading(false);
  }

  async function loadFlags() {
    try {
      const r = await fetch("/api/notetaker-flags");
      const j = await r.json();
      setFlags(j);
    } catch (err) {
      console.error("Error loading flags:", err);
    }
  }

  async function toggleFlag(id, v) {
    try {
      await fetch("/api/toggle-notetaker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, enabled: v }),
      });
      setFlags((prev) => ({ ...prev, [id]: v }));

      // If enabling notetaker, create a meeting record and schedule a recall bot
      if (v) {
        const ev = events.find((x) => x.id === id);
        if (!ev) return;

        // Debug: Try to fetch the Zoom link from possible fields
        let zoomLink = null;
        if (ev.hangoutLink && ev.hangoutLink.includes("zoom")) {
          zoomLink = ev.hangoutLink;
          console.log(`[Bot Debug] Using hangoutLink for Zoom:`, zoomLink);
        } else if (
          ev.raw &&
          ev.raw.location &&
          ev.raw.location.includes("zoom")
        ) {
          zoomLink = ev.raw.location;
          console.log(`[Bot Debug] Using location for Zoom:`, zoomLink);
        } else if (
          ev.raw &&
          ev.raw.conferenceData &&
          ev.raw.conferenceData.entryPoints
        ) {
          const entry = ev.raw.conferenceData.entryPoints.find(
            (e) => e.uri && e.uri.includes("zoom")
          );
          if (entry) {
            zoomLink = entry.uri;
            console.log(
              `[Bot Debug] Using conferenceData.entryPoints for Zoom:`,
              zoomLink
            );
          }
        }
        if (!zoomLink) {
          console.warn(
            `[Bot Debug] No Zoom link found in event fields for event`,
            ev
          );
        }

        // create meeting in our DB (upsert)
        try {
          const meetingPayload = {
            id: ev.id,
            summary: ev.summary,
            start_time: ev.start,
            end_time: ev.end || null,
            platform: zoomLink ? "zoom" : ev.hangoutLink ? "video" : "unknown",
            meeting_url: zoomLink || ev.hangoutLink || null,
            attendees: ev.raw?.attendees || null,
            notetaker_enabled: true,
          };
          console.log(
            `[Bot Debug] Sending meetingPayload to backend:`,
            meetingPayload
          );

          const meetingResp = await fetch("/api/meetings", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(meetingPayload),
          });
          const savedMeeting = await meetingResp.json();
          console.log(`[Bot Debug] Meeting saved response:`, savedMeeting);

          // Verify meeting_url was saved before scheduling
          if (!savedMeeting.meeting_url) {
            console.error(
              `[Bot Debug] Meeting was saved but meeting_url is missing!`,
              savedMeeting
            );
            setBotStatus((s) => ({
              ...s,
              [id]: {
                status: "schedule_failed",
                details: "meeting_url not saved",
              },
            }));
            return;
          }

          // schedule recall bot
          const sched = await fetch("/api/schedule-recall-bot", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ meetingId: ev.id, joinLeadMinutes: 5 }),
          });

          const schedJson = await sched.json();
          console.log(`[Bot Debug] schedule-recall-bot response:`, schedJson);
          if (schedJson?.ok) {
            setBotStatus((s) => ({
              ...s,
              [id]: { status: "scheduled", botId: schedJson.recallBotId },
            }));
            startPollingBotStatus(id);
          } else {
            setBotStatus((s) => ({
              ...s,
              [id]: { status: "schedule_failed", details: schedJson },
            }));
          }
        } catch (err) {
          console.error("[Bot Debug] Error scheduling recall bot:", err);
          setBotStatus((s) => ({
            ...s,
            [id]: { status: "schedule_error", details: String(err) },
          }));
        }
      } else {
        // if disabling, stop any polling and clear status
        stopPollingBotStatus(id);
        setBotStatus((s) => ({ ...s, [id]: undefined }));
      }
    } catch (err) {
      console.error("Error toggling flag:", err);
    }
  }

  function startPollingBotStatus(meetingId) {
    // avoid duplicate pollers
    if (pollers.current[meetingId]) return;
    let attempts = 0;
    const intervalMs = 5000;
    const maxAttempts = 60; // poll for up to ~5 minutes

    const id = setInterval(async () => {
      attempts += 1;
      try {
        const r = await fetch(
          `/api/meetings/${encodeURIComponent(meetingId)}/recall-bots`
        );
        const j = await r.json();
        console.log(
          `[Bot Debug] Polled bot status for meeting ${meetingId}:`,
          j
        );
        const bot = j && j[0];
        if (bot) {
          setBotStatus((s) => ({
            ...s,
            [meetingId]: {
              ...(s[meetingId] || {}),
              status: bot.status,
              last_checked_at: bot.last_checked_at,
              botId: bot.recall_bot_id,
            },
          }));
          if (bot.status === "media_available" || bot.status === "available") {
            stopPollingBotStatus(meetingId);
          }
        } else {
          setBotStatus((s) => ({
            ...s,
            [meetingId]: { ...(s[meetingId] || {}), status: "scheduled" },
          }));
        }
      } catch (err) {
        console.error(
          `[Bot Debug] Error polling bot status for meeting ${meetingId}:`,
          err
        );
        setBotStatus((s) => ({
          ...s,
          [meetingId]: {
            ...(s[meetingId] || {}),
            status: "poll_error",
            details: String(err),
          },
        }));
      }

      if (attempts >= maxAttempts) {
        stopPollingBotStatus(meetingId);
        setBotStatus((s) => ({
          ...s,
          [meetingId]: { ...(s[meetingId] || {}), status: "timeout" },
        }));
      }
    }, intervalMs);

    pollers.current[meetingId] = id;
  }

  function stopPollingBotStatus(meetingId) {
    const id = pollers.current[meetingId];
    if (id) {
      clearInterval(id);
      delete pollers.current[meetingId];
    }
  }

  return (
    <div className="container page">
      <div className="app-container">
        <h1 className="title">Upcoming Events</h1>
        {eventsRangeLabel && (
          <div style={{ marginBottom: 8, color: "#555", fontSize: 13 }}>
            Showing events for: {eventsRangeLabel}
          </div>
        )}
        <button
          onClick={loadEvents}
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
        >
          {loading ? "Loading..." : "Refresh events"}
        </button>

        {events.length === 0 ? (
          <div>No upcoming events found.</div>
        ) : (
          // show max 10 upcoming events and display two cards per row
          <div
            className="list-grid"
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {events.slice(0, 10).map((e) => (
              <div key={e.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>{e.summary}</strong>
                    <div className="meta">
                      {e.accountEmail} • {formatDateTime(e.start)}
                    </div>
                    {e.hangoutLink && (
                      <div className="meta">
                        📹 {e.hangoutLink.includes("zoom") ? "Zoom" : "Video"}
                      </div>
                    )}
                    {/* Show meeting link if present (hangoutLink, location, conferenceData) */}
                    {(() => {
                      const locationLink = e.raw?.location || null;
                      let entryPointLink = null;
                      try {
                        const entryPoints =
                          e.raw?.conferenceData?.entryPoints || [];
                        const ep = entryPoints.find((p) => p.uri);
                        if (ep) entryPointLink = ep.uri;
                      } catch (err) {
                        // ignore
                      }
                      const link =
                        e.hangoutLink || locationLink || entryPointLink || null;
                      if (!link) return null;

                      // determine source field
                      const source = e.hangoutLink
                        ? "hangoutLink"
                        : locationLink
                        ? "location"
                        : entryPointLink
                        ? "conferenceEntryPoint"
                        : "unknown";

                      const isZoom = link.toLowerCase().includes("zoom");

                      const copyToClipboard = async (text) => {
                        try {
                          if (
                            navigator.clipboard &&
                            navigator.clipboard.writeText
                          ) {
                            await navigator.clipboard.writeText(text);
                          } else {
                            const ta = document.createElement("textarea");
                            ta.value = text;
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand("copy");
                            document.body.removeChild(ta);
                          }
                          console.log(
                            "[Bot Debug] Copied link to clipboard:",
                            text
                          );
                        } catch (err) {
                          console.error("[Bot Debug] Copy failed:", err);
                        }
                      };

                      return (
                        <div
                          className="meta"
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {isZoom ? (
                            <span title="Zoom link">🟦 Zoom</span>
                          ) : (
                            <span title="Meeting link">🔗 Link</span>
                          )}
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ wordBreak: "break-all" }}
                          >
                            {link}
                          </a>
                          <button
                            onClick={() => copyToClipboard(link)}
                            className="btn btn-sm"
                            style={{ marginLeft: 8 }}
                            title="Copy meeting link"
                          >
                            Copy
                          </button>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#666",
                              marginLeft: 8,
                            }}
                          >
                            (from: {source})
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={!!flags[e.id]}
                        onChange={(ev) => toggleFlag(e.id, ev.target.checked)}
                      />
                      Notetaker
                    </label>
                    {botStatus[e.id] && (
                      <div
                        style={{ marginLeft: 12, fontSize: 12, color: "#444" }}
                      >
                        Status: <strong>{botStatus[e.id].status}</strong>
                        {botStatus[e.id].last_checked_at && (
                          <div style={{ fontSize: 11, color: "#666" }}>
                            checked:{" "}
                            {new Date(
                              botStatus[e.id].last_checked_at
                            ).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
