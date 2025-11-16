// client/src/pages/LoginPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

// Small helper to present event start times in a readable way.
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

export default function LoginPage({ setIsLoggedIn }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState({});
  const navigate = useNavigate();

  const loadAccounts = useCallback(async () => {
    const r = await apiFetch("/api/accounts");
    const j = await r.json();
    setAccounts(j);
    // If accounts found, consider the user logged in and navigate to events
    if (Array.isArray(j) && j.length > 0) {
      setIsLoggedIn(true);
      try {
        navigate("/events");
      } catch (err) {
        // ignore navigation errors in tests
      }
    }
  }, [navigate, setIsLoggedIn]);

  const loadEvents = useCallback(async () => {
    const r = await apiFetch("/api/events");
    const j = await r.json();
    setEvents(j);
  }, []);

  useEffect(() => {
    apiFetch("/auth/url")
      .then((r) => r.json())
      .then((j) => setAuthUrl(j.url))
      .catch(() => {});
    loadAccounts();
    loadEvents();
    apiFetch("/api/notetaker-flags")
      .then((r) => r.json())
      .then(setFlags)
      .catch(() => {});
  }, [loadAccounts, loadEvents]);

  async function linkAccount() {
    if (!authUrl) return alert("no auth url yet");
    // Open the OAuth flow in a popup and poll the server for connected accounts.
    const popup = window.open(authUrl, "_blank", "width=600,height=700");
    if (!popup)
      return alert("Popup blocked. Please allow popups for this site.");

    let attempts = 0;
    const maxAttempts = 30; // ~30 seconds
    const poll = setInterval(async () => {
      attempts += 1;
      try {
        const r = await apiFetch("/api/accounts");
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j) && j.length > 0) {
            clearInterval(poll);
            try {
              popup.close();
            } catch (err) {}
            setAccounts(j);
            setIsLoggedIn(true);
            navigate("/events");
          }
        }
      } catch (err) {
        // ignore
      }
      if (attempts >= maxAttempts) {
        clearInterval(poll);
      }
    }, 1000);
  }

  async function toggleFlag(id, v) {
    await apiFetch("/api/toggle-notetaker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, enabled: v }),
    });
    setFlags((prev) => ({ ...prev, [id]: v }));

    // Mark user as logged in after setting preferences
    setIsLoggedIn(true);
  }

  return (
    <div className="page app-container">
      <h1 className="title">Post-meeting content generator — login</h1>
      <p className="subtitle">
        Connect Google accounts and choose which events a notetaker should
        attend.
      </p>

      <div style={{ marginBottom: 16 }}>
        <button onClick={linkAccount} className="btn btn-primary">
          Sign in with Google
        </button>
      </div>

      <section style={{ marginBottom: 20 }}>
        <h2>Connected accounts</h2>
        {accounts.length === 0 ? (
          <div>No accounts connected yet.</div>
        ) : (
          <ul>
            {accounts.map((a) => (
              <li key={a.email}>{a.email}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Upcoming events (from all accounts)</h2>
        <button
          onClick={loadEvents}
          className="btn btn-secondary"
          style={{ marginBottom: 8 }}
        >
          Refresh events
        </button>
        {events.length === 0 ? (
          <div>No upcoming events found.</div>
        ) : (
          // show max 10 upcoming events and display two cards per row
          <div
            className="list-grid"
            style={{
              marginTop: 8,
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
                            "[LoginPage] Copied link to clipboard:",
                            text
                          );
                        } catch (err) {
                          console.error("[LoginPage] Copy failed:", err);
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
