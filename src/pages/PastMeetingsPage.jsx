// client/src/pages/PastMeetingsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

// Simple platform icon mapper. Could be extracted to a shared util later.
function platformIcon(platform) {
  if (!platform) return "❓";
  const p = platform.toLowerCase();
  if (p.includes("zoom")) return "🟦"; // Zoom brand color square
  if (p.includes("teams")) return "🟪"; // Teams purple square
  if (p.includes("google") || p.includes("meet")) return "🟩"; // Google Meet green
  if (p.includes("video")) return "📹";
  return "💬";
}

export default function PastMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoading(true);
    try {
      const r = await apiFetch("/api/past-meetings");
      const j = await r.json();
      // Sort by date descending (newest first)
      const sorted = j.sort((a, b) => new Date(b.start) - new Date(a.start));
      setMeetings(sorted);
    } catch (err) {
      console.error("Error loading past meetings:", err);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="app-container">
        <h1 className="title">Past Meetings</h1>
        <button
          onClick={loadMeetings}
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
        >
          {loading ? "Loading..." : "Refresh meetings"}
        </button>

        {meetings.length === 0 ? (
          <div>No past meetings with transcripts yet.</div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {meetings.map((m) => {
              const attendeeList = Array.isArray(m.attendees)
                ? m.attendees
                : typeof m.attendees === "object" && m.attendees !== null
                ? m.attendees.attendees || []
                : [];
              const attendeeNames = attendeeList
                .map((a) => a.email || a.displayName || a.name)
                .filter(Boolean);
              return (
                <Link
                  key={m.id}
                  to={`/meetings/${m.id}`}
                  className="card"
                  style={{ display: "block", textDecoration: "none" }}
                  aria-label={`Open meeting ${m.summary}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "#333" }}>{m.summary}</strong>
                      <div className="meta" style={{ display: "flex", gap: 8 }}>
                        <span title="Platform" style={{ fontSize: 14 }}>
                          {platformIcon(m.platform)}
                        </span>
                        <span>
                          {new Date(m.start).toLocaleDateString()} •{" "}
                          {new Date(m.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {attendeeNames.length > 0 && (
                        <div
                          className="meta"
                          style={{ maxWidth: 500, color: "#555" }}
                        >
                          Attendees ({attendeeNames.length}):{" "}
                          {attendeeNames.slice(0, 5).join(", ")}
                          {attendeeNames.length > 5 && " ..."}
                        </div>
                      )}
                      {m.platform_link && (
                        <div className="meta" style={{ fontSize: 12 }}>
                          Link: {m.platform_link}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12 }}>
                      {m.has_transcript ? (
                        <div
                          className="status-pill status-published"
                          style={{ alignSelf: "flex-start" }}
                        >
                          ✓ Transcript
                        </div>
                      ) : (
                        <div style={{ color: "#999" }}>No transcript</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
