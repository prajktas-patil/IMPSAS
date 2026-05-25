// screens/DashboardScreen.jsx — Real-time via Socket.io
import { useState, useEffect, useRef } from "react";
import { theme } from "../theme.js";
import { Card, Btn, StatusBadge } from "../components/UI.jsx";
import axios from "axios";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const QUICK_ACTIONS = [
  { label: "Register Case", icon: "📝", screen: "register", color: theme.blue },
  { label: "Run Search",    icon: "🔍", screen: "search",   color: theme.green },
  { label: "Location Map",  icon: "🗺", screen: "location", color: theme.yellow },
  { label: "Admin Panel",   icon: "⚙️", screen: "admin",    color: theme.accent },
];

export default function DashboardScreen({ onNav, role, userName }) {
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState(null); // latest real-time alert banner
  const socketRef = useRef(null);

  // ── Initial fetch ─────────────────────────────────────────────
  const fetchCases = () =>
    axios.get(`${API}/api/cases`)
      .then(res => { setCases(res.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { fetchCases(); }, []);

  // ── Socket.io — live updates ───────────────────────────────────
  useEffect(() => {
    const socket = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    // New case registered by another officer → refresh list
    socket.on("case_registered", () => fetchCases());

    // Status changed (Found / Matched / Closed) → refresh + show banner
    socket.on("status_changed", (data) => {
      fetchCases();
      setLiveAlert({ type: "status", ...data });
      setTimeout(() => setLiveAlert(null), 6000);
    });

    // CCTV / sighting alert → refresh stats + show banner
    socket.on("cctv_alert", (data) => {
      fetchCases();
      setLiveAlert({ type: "sighting", ...data });
      setTimeout(() => setLiveAlert(null), 6000);
    });

    // Emergency alert (high confidence match)
    socket.on("emergency_alert", (data) => {
      fetchCases();
      setLiveAlert({ type: "emergency", ...data });
      setTimeout(() => setLiveAlert(null), 10000);
    });

    return () => socket.disconnect();
  }, []);

  const stats = [
    { label: "Active Cases",  value: cases.filter(c => c.status === "Active").length,  color: theme.yellow, icon: "📋" },
    { label: "Matches Found", value: cases.filter(c => c.status === "Matched").length, color: theme.green,  icon: "🎯" },
    { label: "Total Cases",   value: cases.length,                                      color: theme.blue,   icon: "📊" },
    { label: "Closed Cases",  value: cases.filter(c => c.status === "Closed").length,  color: theme.muted,  icon: "✅" },
  ];

  const recentCases = cases.slice(0, 3);

  return (
    <div style={{ padding: "0 16px 100px" }}>

      {/* ── Live Alert Banner ── */}
      {liveAlert && (
        <div className="slide-up" style={{
          position: "sticky", top: 0, zIndex: 100,
          background: liveAlert.type === "emergency" ? theme.accent
                    : liveAlert.type === "sighting"  ? theme.yellow
                    : theme.green,
          color: "#fff", padding: "10px 14px", borderRadius: 12,
          marginBottom: 12, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {liveAlert.type === "emergency" ? "🚨" : liveAlert.type === "sighting" ? "📍" : "🔄"}
          {liveAlert.type === "emergency" && `EMERGENCY: ${liveAlert.name} spotted at ${liveAlert.location} — ${liveAlert.matchScore}% match`}
          {liveAlert.type === "sighting"  && `Sighting: ${liveAlert.name} at ${liveAlert.location}`}
          {liveAlert.type === "status"    && `Case updated: ${liveAlert.name} → ${liveAlert.status}`}
          <button onClick={() => setLiveAlert(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "20px 0 16px", borderBottom: `1px solid ${theme.border}`, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: theme.muted, fontSize: 12, letterSpacing: 1 }}>WELCOME BACK</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {userName || (role === "admin" ? "Admin" : "Officer")} Portal
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: theme.gradient,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {role === "admin" ? "🛡" : "👮"}
          </div>
        </div>
      </div>

      {/* Active Cases Banner */}
      {cases.filter(c => c.status === "Active").length > 0 && (
        <Card style={{
          background: "linear-gradient(135deg, #FF4D6D22, #FF8C4222)",
          border: `1px solid ${theme.accent}44`, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.accent }} />
              <div className="ping" style={{ position: "absolute", top: 0, left: 0, width: 10, height: 10, borderRadius: "50%", background: theme.accent }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: theme.accent }}>
                {cases.filter(c => c.status === "Active").length} ACTIVE MISSING CASES
              </div>
              <div style={{ fontSize: 12, color: theme.muted }}>Immediate attention required</div>
            </div>
            <Btn small onClick={() => onNav("cases")} variant="danger" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
              View →
            </Btn>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>
              {loading ? "..." : s.value}
            </div>
            <div style={{ fontSize: 11, color: theme.muted, letterSpacing: 0.5 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Cases</div>
          <span onClick={() => onNav("cases")} style={{ color: theme.blue, fontSize: 12, cursor: "pointer" }}>
            View All →
          </span>
        </div>

        {loading ? (
          <div style={{ color: theme.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>
        ) : recentCases.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 20 }}>
            <div style={{ color: theme.muted, fontSize: 13 }}>No cases registered yet</div>
            <Btn onClick={() => onNav("register")} style={{ marginTop: 12 }}>Register First Case</Btn>
          </Card>
        ) : (
          recentCases.map((c, i) => (
            <Card key={i} style={{ marginBottom: 10 }} onClick={() => onNav("cases")}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {c.age < 18 ? "👦" : c.gender === "Female" ? "👩" : "👨"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>
                    {c.caseId} · {c.location}
                  </div>
                </div>
                <StatusBadge status={c.status?.toLowerCase()} />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {QUICK_ACTIONS.map((a, i) => (
          <Card key={i} onClick={() => onNav(a.screen)} style={{ textAlign: "center", padding: "18px 12px" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}