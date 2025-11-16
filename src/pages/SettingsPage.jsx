// client/src/pages/SettingsPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../config";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState({ join_lead_minutes: 5 });
  const [automations, setAutomations] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newAutomation, setNewAutomation] = useState({
    platform: "linkedin",
    name: "",
    custom_prompt: "",
  });
  const [creatingAutomation, setCreatingAutomation] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAutomations();
    loadSocialAccounts();

    // Check for OAuth success/error messages
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      setMessage({ type: "success", text: success });
      setTimeout(() => setMessage(null), 3000);
    }
    if (error) {
      setMessage({ type: "error", text: error });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [searchParams]);

  async function loadSettings() {
    try {
      const r = await fetch(`${API_URL}/api/settings`);
      const j = await r.json();
      setSettings(j || { join_lead_minutes: 5 });
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  async function loadAutomations() {
    try {
      const r = await fetch(`${API_URL}/api/automations`);
      const j = await r.json();
      setAutomations(j);
    } catch (err) {
      console.error("Error loading automations:", err);
    }
    setLoading(false);
  }

  async function loadSocialAccounts() {
    try {
      const r = await fetch(`${API_URL}/api/social-accounts`);
      const j = await r.json();
      setSocialAccounts(j);
    } catch (err) {
      console.error("Error loading social accounts:", err);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      alert("Settings saved!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Error saving settings");
    }
    setSaving(false);
  }

  async function createAutomation() {
    if (!newAutomation.name.trim()) {
      alert("Please enter a name for the automation");
      return;
    }
    setCreatingAutomation(true);
    try {
      const r = await fetch(`${API_URL}/api/automations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: newAutomation.platform,
          name: newAutomation.name,
          prompt: newAutomation.custom_prompt,
        }),
      });
      const j = await r.json();
      setAutomations([...automations, j.automation]);
      setNewAutomation({ platform: "linkedin", name: "", custom_prompt: "" });
      alert("Automation created!");
    } catch (err) {
      console.error("Error creating automation:", err);
      alert("Error creating automation");
    }
    setCreatingAutomation(false);
  }

  async function deleteAutomation(id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this automation?")) return;
    try {
      await fetch(`${API_URL}/api/automations/${id}`, { method: "DELETE" });
      setAutomations(automations.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting automation:", err);
      // eslint-disable-next-line no-restricted-globals
      alert("Error deleting automation");
    }
  }

  if (loading) {
    return <div className="page">Loading settings...</div>;
  }

  const linkedinAccount = socialAccounts.find((a) => a.platform === "linkedin");
  const facebookAccount = socialAccounts.find((a) => a.platform === "facebook");

  return (
    <div className="page app-container" style={{ maxWidth: 900 }}>
      <h1 className="title">Settings</h1>

      {message && (
        <div
          className={
            message.type === "success" ? "message-success" : "message-error"
          }
          style={{ marginBottom: 16 }}
        >
          {message.text}
        </div>
      )}

      {/* Join Lead Time */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ marginTop: 0 }}>Join Lead Time</h2>
        <div className="form-row">
          Start notetaker <strong>{settings.join_lead_minutes}</strong> minutes
          before meeting start
        </div>
        <input
          type="range"
          min="1"
          max="30"
          value={settings.join_lead_minutes}
          onChange={(e) =>
            setSettings({
              ...settings,
              join_lead_minutes: parseInt(e.target.value),
            })
          }
          className="input"
          style={{ maxWidth: 300 }}
        />
        <div style={{ marginTop: 12 }}>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-success"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Social Media Accounts */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ marginTop: 0 }}>Connected Accounts</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>LinkedIn</strong>
              {linkedinAccount ? (
                <div className="meta">
                  Connected as {linkedinAccount.platform_user_id}
                </div>
              ) : (
                <div className="meta" style={{ color: "#999" }}>
                  Not connected
                </div>
              )}
            </div>
            <div>
              <button
                className={linkedinAccount ? "btn btn-danger" : "btn"}
                style={
                  linkedinAccount
                    ? {}
                    : { background: "#0A66C2", color: "#fff" }
                }
                onClick={async () => {
                  if (linkedinAccount) {
                    // eslint-disable-next-line no-restricted-globals
                    if (!confirm("Disconnect LinkedIn account?")) return;
                    try {
                      await fetch(`${API_URL}/api/social-accounts/linkedin`, {
                        method: "DELETE",
                      });
                      setSocialAccounts(
                        socialAccounts.filter((a) => a.platform !== "linkedin")
                      );
                      setMessage({
                        type: "success",
                        text: "LinkedIn disconnected",
                      });
                      setTimeout(() => setMessage(null), 3000);
                    } catch (err) {
                      console.error(err);
                      alert("Failed to disconnect");
                    }
                  } else {
                    try {
                      const r = await fetch(`${API_URL}/api/auth/linkedin`);
                      const j = await r.json();
                      window.location.href = j.url;
                    } catch (err) {
                      console.error(err);
                      alert("Failed to connect LinkedIn");
                    }
                  }
                }}
              >
                {linkedinAccount ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Facebook</strong>
              {facebookAccount ? (
                <div className="meta">
                  Connected as {facebookAccount.platform_user_id}
                </div>
              ) : (
                <div className="meta" style={{ color: "#999" }}>
                  Not connected
                </div>
              )}
            </div>
            <div>
              <button
                className={facebookAccount ? "btn btn-danger" : "btn"}
                style={
                  facebookAccount
                    ? {}
                    : { background: "#1877F2", color: "#fff" }
                }
                onClick={async () => {
                  if (facebookAccount) {
                    // eslint-disable-next-line no-restricted-globals
                    if (!confirm("Disconnect Facebook account?")) return;
                    try {
                      await fetch(`${API_URL}/api/social-accounts/facebook`, {
                        method: "DELETE",
                      });
                      setSocialAccounts(
                        socialAccounts.filter((a) => a.platform !== "facebook")
                      );
                      setMessage({
                        type: "success",
                        text: "Facebook disconnected",
                      });
                      setTimeout(() => setMessage(null), 3000);
                    } catch (err) {
                      console.error(err);
                      alert("Failed to disconnect");
                    }
                  } else {
                    try {
                      const r = await fetch(`${API_URL}/api/auth/facebook`);
                      const j = await r.json();
                      window.location.href = j.url;
                    } catch (err) {
                      console.error(err);
                      alert("Failed to connect Facebook");
                    }
                  }
                }}
              >
                {facebookAccount ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Automations */}
      <div
        style={{
          marginBottom: 32,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Post Automations</h2>
        <p style={{ fontSize: 13, color: "#666" }}>
          Create custom prompts for specific platforms to automatically generate
          tailored posts.
        </p>

        {/* Create Automation Form */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#f9f9f9",
            borderRadius: 4,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
            >
              Platform:
            </label>
            <select
              value={newAutomation.platform}
              onChange={(e) =>
                setNewAutomation({ ...newAutomation, platform: e.target.value })
              }
              style={{ padding: "6px 8px", width: "100%", maxWidth: 200 }}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
            >
              Name:
            </label>
            <input
              type="text"
              value={newAutomation.name}
              onChange={(e) =>
                setNewAutomation({ ...newAutomation, name: e.target.value })
              }
              placeholder="e.g., Company Updates, Technical Tips"
              style={{ padding: "6px 8px", width: "100%", maxWidth: 400 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
            >
              Custom Prompt (optional):
            </label>
            <textarea
              value={newAutomation.custom_prompt}
              onChange={(e) =>
                setNewAutomation({
                  ...newAutomation,
                  custom_prompt: e.target.value,
                })
              }
              placeholder="e.g., Focus on actionable takeaways, use casual tone, include hashtags"
              style={{
                padding: "6px 8px",
                width: "100%",
                minHeight: 80,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
          </div>

          <button
            onClick={createAutomation}
            disabled={creatingAutomation}
            style={{
              padding: "8px 12px",
              backgroundColor: creatingAutomation ? "#ccc" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: creatingAutomation ? "not-allowed" : "pointer",
            }}
          >
            {creatingAutomation ? "Creating..." : "Create Automation"}
          </button>
        </div>

        {/* Automations List */}
        <div style={{ marginTop: 16 }}>
          <h3>Your Automations</h3>
          {automations.length === 0 ? (
            <div style={{ color: "#999", fontSize: 13 }}>
              No automations yet.
            </div>
          ) : (
            <div>
              {automations.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 4,
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{a.name}</strong>
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "2px 6px",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        borderRadius: 3,
                        fontSize: 11,
                      }}
                    >
                      {a.platform}
                    </span>
                    {a.custom_prompt && (
                      <div
                        style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                      >
                        Prompt: {a.custom_prompt.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAutomation(a.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
