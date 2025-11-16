// client/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EventsPage from "./pages/EventsPage";
import PastMeetingsPage from "./pages/PastMeetingsPage";
import MeetingDetailPage from "./pages/MeetingDetailPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked")) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        <nav className="top-nav">
          <Link to="/" className="brand">
            📱 Post-meeting Generator
          </Link>
          {isLoggedIn && (
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
          )}
        </nav>

        <div className="page">
          <Routes>
            <Route
              path="/"
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
