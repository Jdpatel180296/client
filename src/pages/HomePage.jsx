import React from "react";
import { Link } from "react-router-dom";

export default function HomePage({ isLoggedIn }) {
  return (
    <div className="page app-container">
      <h1 className="title">Post-meeting content generator</h1>
      <p className="subtitle">
        Generate social posts, meeting summaries and follow-ups automatically
        after your meetings. Connect a Google account to get started.
      </p>

      <div style={{ marginTop: 20 }}>
        {isLoggedIn ? (
          <Link to="/events" className="btn btn-primary">
            View your events
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Sign in with Google
          </Link>
        )}
      </div>

      <section style={{ marginTop: 28 }}>
        <h2>How it works</h2>
        <ul>
          <li>Connect Google — the app reads your calendar events.</li>
          <li>Enable the Notetaker for events you want covered.</li>
          <li>We join the meeting, record, transcribe and generate posts.</li>
        </ul>
      </section>
    </div>
  );
}
