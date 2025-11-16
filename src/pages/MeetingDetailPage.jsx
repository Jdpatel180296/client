// client/src/pages/MeetingDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [selectedAutomation, setSelectedAutomation] = useState("");
  const [automations, setAutomations] = useState([]);
  const [copiedPostId, setCopiedPostId] = useState(null);

  useEffect(() => {
    loadMeeting();
    loadPosts();
    loadAutomations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadMeeting() {
    try {
      const r = await fetch(`/api/meetings/${id}`);
      const j = await r.json();
      setMeeting(j);
    } catch (err) {
      console.error("Error loading meeting:", err);
    }
    setLoading(false);
  }

  async function loadPosts() {
    try {
      const r = await fetch(`/api/meetings/${id}/posts`);
      const j = await r.json();
      setPosts(j);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  }

  async function loadAutomations() {
    try {
      const r = await fetch("/api/automations");
      const j = await r.json();
      setAutomations(j);
    } catch (err) {
      console.error("Error loading automations:", err);
    }
  }

  async function generateEmail() {
    setGeneratingEmail(true);
    try {
      const r = await fetch("/api/generate-followup-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          meeting_id: id,
          transcript: meeting?.transcript || "",
        }),
      });
      const j = await r.json();
      setEmail(j.email);
    } catch (err) {
      console.error("Error generating email:", err);
      setEmail("Error generating email. Please try again.");
    }
    setGeneratingEmail(false);
  }

  async function generatePost() {
    setGeneratingPost(true);
    try {
      const r = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          meeting_id: id,
          platform: selectedPlatform,
          automation_id: selectedAutomation || null,
          transcript: meeting?.transcript || "",
        }),
      });
      const j = await r.json();
      setPosts([...posts, j]);
      setSelectedPlatform("linkedin");
      setSelectedAutomation("");
    } catch (err) {
      console.error("Error generating post:", err);
    }
    setGeneratingPost(false);
  }

  async function publishPost(postId) {
    try {
      const r = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json();
      setPosts(posts.map((p) => (p.id === postId ? j.post : p)));
    } catch (err) {
      console.error("Error publishing post:", err);
    }
  }

  function copyToClipboard(text, postId) {
    navigator.clipboard.writeText(text);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2000);
  }

  if (loading) {
    return <div className="page">Loading meeting...</div>;
  }

  if (!meeting) {
    return <div className="page">Meeting not found.</div>;
  }

  const filteredAutomations = automations.filter(
    (a) => a.platform === selectedPlatform
  );

  return (
    <div className="page app-container">
      <h1 className="title">{meeting.summary}</h1>
      <div className="meta" style={{ marginBottom: 20 }}>
        {new Date(meeting.start).toLocaleDateString()} •{" "}
        {new Date(meeting.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      {/* Transcript Section */}
      <div style={{ marginBottom: 32 }}>
        <h2>Transcript</h2>
        <div className="transcript">
          {meeting.transcript || "No transcript available yet."}
        </div>
      </div>

      {/* Follow-up Email Section */}
      <div style={{ marginBottom: 32 }}>
        <h2>Follow-up Email</h2>
        <button
          onClick={generateEmail}
          disabled={generatingEmail}
          className="btn btn-primary"
          style={{ marginBottom: 12 }}
        >
          {generatingEmail ? "Generating..." : "Generate Email"}
        </button>
        {email && (
          <div className="card" style={{ marginTop: 8, background: "#f0f8ff" }}>
            <div style={{ whiteSpace: "pre-wrap" }}>{email}</div>
          </div>
        )}
      </div>

      {/* Post Generation Section */}
      <div style={{ marginBottom: 32 }}>
        <h2>Social Media Posts</h2>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <label className="meta">Platform:</label>
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setSelectedAutomation("");
              }}
              className="input"
              style={{ maxWidth: 200 }}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div className="form-row">
            <label className="meta">Automation (optional):</label>
            <select
              value={selectedAutomation}
              onChange={(e) => setSelectedAutomation(e.target.value)}
              className="input"
              style={{ maxWidth: 200 }}
            >
              <option value="">Use default prompt</option>
              {filteredAutomations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generatePost}
            disabled={generatingPost}
            className="btn btn-success"
          >
            {generatingPost ? "Generating..." : "Generate Post"}
          </button>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div style={{ color: "#999" }}>No posts generated yet.</div>
        ) : (
          <div>
            {posts.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  marginBottom: 12,
                  background: p.status === "published" ? "#f0fff0" : "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong>{p.platform}</strong>
                    <span
                      style={{ marginLeft: 12 }}
                      className={`status-pill ${
                        p.status === "published"
                          ? "status-published"
                          : "status-draft"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.status === "draft" && (
                      <button
                        onClick={() => publishPost(p.id)}
                        className="btn btn-primary"
                        style={{ fontSize: 12 }}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(p.content, p.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: 12 }}
                    >
                      {copiedPostId === p.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {p.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
