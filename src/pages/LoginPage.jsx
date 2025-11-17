// client/src/pages/LoginPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function LoginPage({ setIsLoggedIn }) {
  const [authUrl, setAuthUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get Google OAuth URL
    apiFetch("/auth/url")
      .then((r) => r.json())
      .then((j) => setAuthUrl(j.url))
      .catch(() => {});

    // Check if already logged in
    apiFetch("/api/accounts")
      .then((r) => r.json())
      .then((accounts) => {
        if (Array.isArray(accounts) && accounts.length > 0) {
          setIsLoggedIn(true);
          navigate("/events");
        }
      })
      .catch(() => {});
  }, [navigate, setIsLoggedIn]);

  async function handleGoogleLogin() {
    if (!authUrl) return alert("Authentication URL not ready yet");

    setIsLoading(true);

    // Open OAuth flow in popup
    const popup = window.open(authUrl, "_blank", "width=600,height=700");
    if (!popup) {
      setIsLoading(false);
      return alert("Popup blocked. Please allow popups for this site.");
    }

    // Poll for successful authentication
    let attempts = 0;
    const maxAttempts = 30;
    const poll = setInterval(async () => {
      attempts += 1;
      try {
        const r = await apiFetch("/api/accounts");
        if (r.ok) {
          const accounts = await r.json();
          if (Array.isArray(accounts) && accounts.length > 0) {
            clearInterval(poll);
            try {
              popup.close();
            } catch (err) {}
            setIsLoading(false);
            setIsLoggedIn(true);
            navigate("/events");
          }
        }
      } catch (err) {
        // ignore
      }
      if (attempts >= maxAttempts) {
        clearInterval(poll);
        setIsLoading(false);
      }
    }, 1000);
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-icon">📱</div>
            <h1 className="login-title">Post-Meeting Generator</h1>
            <p className="login-subtitle">
              Transform your meetings into actionable content
            </p>
          </div>

          <div className="login-body">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || !authUrl}
              className="google-login-btn"
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🎙️</span>
                <span className="feature-text">Auto-transcribe meetings</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span className="feature-text">Generate social posts</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span className="feature-text">Create follow-up emails</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span className="feature-text">AI-powered insights</span>
              </div>
            </div>
          </div>

          <div className="login-footer">
            <p>Secure authentication with your Google account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
