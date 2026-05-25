// screens/MatchesScreen.jsx — Real-time matches with socket.io
import { useState, useEffect, useRef } from "react";
import { theme } from "../theme.js";
import { Card, Btn, ConfidenceBar } from "../components/UI.jsx";
import axios from "axios";
import { io } from "socket.io-client";

const API        = process.env.REACT_APP_API_URL    || "http://localhost:5001";
const PYTHON_URL = process.env.REACT_APP_PYTHON_URL || "http://localhost:5002";

export default function MatchesScreen({ onNav }) {
  const [matches,   setMatches]   = useState([]);
  const [cases,     setCases]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("matches");
  const [newMatchBadge, setNewMatchBadge] = useState(0); // live badge counter

  // Sighting Report form
  const [selectedCase,  setSelectedCase]  = useState("");
  const [sightLocation, setSightLocation] = useState("");
  const [sightFile,     setSightFile]     = useState(null);
  const [sightImage,    setSightImage]    = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const fileRef = useRef(null);
  const socketRef = useRef(null);

  const fetchCases = () =>
    axios.get(`${API}/api/cases`).then(res => {
      setCases(res.data);
      setMatches(res.data.filter(c => c.status === "Matched"));
      setLoading(false);
    }).catch(() => setLoading(false));

  useEffect(() => { fetchCases(); }, []);

  // ── Socket.io — live match updates ────────────────────────────
  useEffect(() => {
    const socket = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // When a sighting is logged and status flips to Matched → refresh
    socket.on("cctv_alert", () => {
      fetchCases();
      if (tab !== "matches") setNewMatchBadge(n => n + 1);
    });
    socket.on("emergency_alert", () => {
      fetchCases();
      if (tab !== "matches") setNewMatchBadge(n => n + 1);
    });
    socket.on("status_changed", () => fetchCases());

    return () => socket.disconnect();
  }, [tab]);

  // Clear badge when user switches to matches tab
  useEffect(() => {
    if (tab === "matches") setNewMatchBadge(0);
  }, [tab]);

  const handleSightingSubmit = async () => {
    if (!sightLocation) { alert("Please enter location."); return; }
    if (!sightFile)     { alert("Please upload a photo."); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("photo", sightFile);
      formData.append("cases", JSON.stringify(cases.filter(c => c.photos?.length > 0)));

      // Run AI match
      let matchScore = 0;
      let matchedCaseId = selectedCase;
      try {
        const matchRes = await axios.post(`${PYTHON_URL}/match`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        });
        const topMatch = matchRes.data.matches?.[0];
        if (topMatch) {
          matchScore    = topMatch.confidenceScore;
          matchedCaseId = topMatch._id;
        }
      } catch {
        // Python offline — fall back to manual case selection
        matchedCaseId = selectedCase;
        matchScore = 0;
      }

      if (!matchedCaseId) { alert("Could not identify a case. Please select one manually."); setSubmitting(false); return; }

      // Save sighting to MongoDB
      await axios.post(`${API}/api/cases/${matchedCaseId}/sighting`, {
        location: sightLocation,
        matchScore,
        source: "manual_report",
      });

      // High confidence → flip status to Matched
      if (matchScore >= 70) {
        await axios.patch(`${API}/api/cases/${matchedCaseId}/status`, { status: "Matched" });
      }

      setSubmitting(false);
      setSubmitted(true);
      fetchCases();
    } catch (err) {
      setSubmitting(false);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  if (submitted) return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }} className="fade-in">
      <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Sighting Reported!</div>
      <div style={{ color: theme.muted, fontSize: 13, textAlign: "center", marginBottom: 24 }}>
        Your sighting has been recorded and the family has been notified.
      </div>
      <Btn onClick={() => { setSubmitted(false); setTab("matches"); setSightFile(null); setSightImage(null); setSightLocation(""); }}>
        Back to Matches
      </Btn>
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Match Review</div>
        <div style={{ color: theme.muted, fontSize: 12 }}>Live matches · Sighting reports</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "matches", label: "🎯 Matches" },
          { id: "report",  label: "📸 Report Sighting" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px", borderRadius: 12, position: "relative",
            border: `1px solid ${tab === t.id ? theme.accent : theme.border}`,
            background: tab === t.id ? theme.accentSoft : "transparent",
            color: tab === t.id ? theme.accent : theme.muted,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {t.label}
            {t.id === "matches" && newMatchBadge > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                background: theme.accent, color: "#fff",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{newMatchBadge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── MATCHES TAB ── */}
      {tab === "matches" && (
        <>
          {loading ? (
            <div style={{ textAlign: "center", color: theme.muted, padding: 40 }}>Loading...</div>
          ) : matches.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No Matches Yet</div>
              <div style={{ color: theme.muted, fontSize: 13, marginBottom: 16 }}>
                Use the Search screen to find matches or report a sighting.
              </div>
              <Btn onClick={() => setTab("report")}>📸 Report Sighting</Btn>
            </Card>
          ) : (
            matches.map((c, i) => (
              <Card key={i} style={{ marginBottom: 14, borderLeft: `3px solid ${theme.green}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.muted }}>{c.caseId}</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>📍 {c.location}</div>
                  </div>
                  <span style={{ background: theme.greenSoft, color: theme.green, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    ✓ MATCHED
                  </span>
                </div>

                {c.sightings?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>LATEST SIGHTING</div>
                    <div style={{ background: theme.surface, borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>📍 {c.sightings[c.sightings.length - 1].location}</div>
                      <div style={{ fontSize: 11, color: theme.muted }}>
                        Match Score: {c.sightings[c.sightings.length - 1].matchScore}%
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" small style={{ flex: 1 }} onClick={() => onNav("location")}>
                    🗺 View on Map
                  </Btn>
                  <Btn variant="success" small style={{ flex: 1 }} onClick={() => onNav("cases")}>
                    📋 View Case
                  </Btn>
                </div>
              </Card>
            ))
          )}
        </>
      )}

      {/* ── REPORT SIGHTING TAB ── */}
      {tab === "report" && (
        <div className="slide-up">
          <Card style={{ background: "#4D9FFF11", border: `1px solid ${theme.blue}33`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.blue, fontWeight: 600 }}>
              📸 Spotted someone? Report it here and our AI will instantly match them to active cases.
            </div>
          </Card>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>
              SELECT CASE (optional — AI will decide if blank)
            </div>
            <select
              value={selectedCase}
              onChange={e => setSelectedCase(e.target.value)}
              style={{
                width: "100%", background: theme.surface,
                border: `1px solid ${theme.border}`, borderRadius: 12,
                padding: "12px 14px", color: theme.text, fontSize: 14,
                fontFamily: "'Space Grotesk',sans-serif", outline: "none",
              }}
            >
              <option value="">-- Let AI decide --</option>
              {cases.filter(c => c.status === "Active").map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.caseId})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>
              WHERE DID YOU SEE THEM?
            </div>
            <input
              type="text"
              value={sightLocation}
              onChange={e => setSightLocation(e.target.value)}
              placeholder="e.g. FC Road, Pune"
              style={{
                width: "100%", background: theme.surface,
                border: `1px solid ${theme.border}`, borderRadius: 12,
                padding: "12px 14px", color: theme.text, fontSize: 14,
                fontFamily: "'Space Grotesk',sans-serif", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <input
            ref={fileRef} type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files[0];
              if (file) { setSightFile(file); setSightImage(URL.createObjectURL(file)); }
            }}
          />

          <Card
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${sightImage ? theme.green : theme.blue}`,
              textAlign: "center", padding: sightImage ? 12 : 28,
              cursor: "pointer", marginBottom: 16,
              background: sightImage ? "#00E5A008" : theme.card,
            }}
          >
            {sightImage ? (
              <>
                <img src={sightImage} alt="sighting" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>✅ Photo ready — click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Upload Sighting Photo</div>
                <div style={{ color: theme.muted, fontSize: 12 }}>Take or upload a clear photo of the person</div>
              </>
            )}
          </Card>

          <Btn onClick={handleSightingSubmit} style={{ width: "100%" }}>
            {submitting
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} />
                  AI Matching & Saving...
                </span>
              : "🤖 Submit Sighting Report"
            }
          </Btn>
        </div>
      )}
    </div>
  );
}