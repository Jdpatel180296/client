// client/src/pages/LoginPage.jsx
import React, { useEffect, useState } from "react";

export default function LoginPage({ setIsLoggedIn }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [flags, setFlags] = useState({});

  useEffect(() => {
    fetch("/auth/url")
      .then((r) => r.json())
      .then((j) => setAuthUrl(j.url))
      .catch(() => {});
    loadAccounts();
    loadEvents();
    fetch("/api/notetaker-flags")
      .then((r) => r.json())
      .then(setFlags)
      .catch(() => {});
  }, []);

  async function loadAccounts() {
    const r = await fetch("/api/accounts");
    const j = await r.json();
    setAccounts(j);
  }

  async function loadEvents() {
    const r = await fetch("/api/events");
    const j = await r.json();
    setEvents(j);
  }

  async function linkAccount() {
    if (!authUrl) return alert("no auth url yet");
    window.open(authUrl, "_blank");
  }

  async function toggleFlag(id, v) {
    await fetch("/api/toggle-notetaker", {
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
          <div className="list-grid" style={{ marginTop: 8 }}>
            {events.map((e) => (
              <div key={e.id} className="card">
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong>{e.summary}</strong>
                    <div className="meta">
                      {e.accountEmail} • {e.start}
                    </div>
                  </div>
                  <div>
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
