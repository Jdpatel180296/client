// client/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import PastMeetingsPage from "./pages/PastMeetingsPage";
import MeetingDetailPage from "./pages/MeetingDetailPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";
import { apiFetch } from "./utils/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked")) {
      setIsLoggedIn(true);
    }
    // Also check server for connected accounts (reliable way to detect login)
    (async () => {
      try {
        const r = await apiFetch("/api/accounts");
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j) && j.length > 0) setIsLoggedIn(true);
        }
      } catch (err) {
        // ignore — user is likely not logged in
      }
    })();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <nav className="top-nav">
          <Link to="/" className="brand">
            📱 Post-meeting Generator
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/events" className="nav-link">
                Events
              </Link>
              <Link to="/past-meetings" className="nav-link">
                Past Meetings
              </Link>
              <Link to="/settings" className="nav-link">
                Settings
              </Link>
            </>
          ) : (
            <Link to="/login" className="nav-link">
              Login
            </Link>
          )}
        </nav>

        <div className="page">
          <Routes>
            <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
            <Route
              path="/login"
              element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
            />

            {isLoggedIn && (
              <>
                <Route path="/events" element={<EventsPage />} />
                <Route path="/past-meetings" element={<PastMeetingsPage />} />
                <Route path="/meetings/:id" element={<MeetingDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}
