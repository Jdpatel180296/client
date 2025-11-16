// client/src/pages/EventsPage.jsx
import React, { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
    loadFlags();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const r = await fetch("/api/events");
      const j = await r.json();
      setEvents(j);
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
    } catch (err) {
      console.error("Error toggling flag:", err);
    }
  }

  return (
    <div className="container page">
      <div className="app-container">
        <h1 className="title">Upcoming Events</h1>
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
          <div className="list-grid" style={{ marginTop: 12 }}>
            {events.map((e) => (
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
                      {e.accountEmail} • {e.start}
                    </div>
                    {e.hangoutLink && (
                      <div className="meta">
                        📹 {e.hangoutLink.includes("zoom") ? "Zoom" : "Video"}
                      </div>
                    )}
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
      </div>
    </div>
  );
}
