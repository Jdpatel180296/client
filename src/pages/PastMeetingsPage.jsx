// client/src/pages/PastMeetingsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

export default function PastMeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/past-meetings`);
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
            {meetings.map((m) => (
              <Link
                key={m.id}
                to={`/meetings/${m.id}`}
                className="card"
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong style={{ color: "#333" }}>{m.summary}</strong>
                    <div className="meta">
                      {new Date(m.start).toLocaleDateString()} •{" "}
                      {new Date(m.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {m.description && (
                      <div
                        className="meta"
                        style={{ maxWidth: 400, color: "#999" }}
                      >
                        {m.description.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    {m.has_transcript ? (
                      <div className="status-pill status-published">
                        ✓ Transcript
                      </div>
                    ) : (
                      <div style={{ color: "#999" }}>No transcript</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
