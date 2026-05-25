// ============================================================
// screens/AlertsScreen.jsx — Enhanced with confidence scores
//   & emergency alerts panel
// ============================================================

import { useState, useEffect, useRef } from "react";
import { theme } from "../theme.js";
import { Card, Btn } from "../components/UI.jsx";
import axios from "axios";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function AlertsScreen({ onNav }) {
  const [cases,         setCases]         = useState([]);
  const [liveAlerts,    setLiveAlerts]    = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [connected,     setConnected]     = useState(false);
  const [sendingAlert,  setSendingAlert]  = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/api/cases`)
      .then(res => { setCases(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io(API);
    socketRef.current = socket;

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("cctv_alert", (alert) => {
      setLiveAlerts(prev => [
        { ...alert, receivedAt: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      axios.get(`${API}/api/cases`).then(res => setCases(res.data)).catch(() => {});
    });

    socket.on("emergency_alert", (alert) => {
      setEmergencyAlerts(prev => [
        { ...alert, receivedAt: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    });

    return () => socket.disconnect();
  }, []);

  const alerts  = cases.filter(c => c.sightings && c.sightings.length > 0);
  const matched = cases.filter(c => c.status === "Matched");

  const scoreColor = (s) => s >= 75 ? theme.green : s >= 55 ? theme.yellow : theme.accent;
  const scoreLabel = (s) => s >= 75 ? "HIGH"       : s >= 55 ? "POSSIBLE"  : "LOW";

  const sendEmergencyAlert = async (caseDoc) => {
    setSendingAlert(caseDoc._id);
    try {
      const res = await axios.post(`${API}/api/cases/${caseDoc._id}/emergency-alert`, {
        location: caseDoc.location,
        confidenceScore: 100,
        message: "Manual emergency alert triggered by officer",
      });
      alert(`Emergency alert sent! ${res.data.alertsSent?.length || 0} notification(s) dispatched.`);
    } catch (err) {
      alert("Failed to send alert: " + (err.response?.data?.message || err.message));
    }
    setSendingAlert(null);
  };

  const ConfidenceDisplay = ({ score }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{
        background: scoreColor(score) + "22", color: scoreColor(score),
        padding: "8px 14px", borderRadius: 12,
        fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
      }}>
        {score}%
      </div>
      <div style={{ fontSize: 10, color: scoreColor(score), fontWeight: 600, marginTop: 4 }}>
        {scoreLabel(score)}
      </div>
      {/* Mini progress bar */}
      <div style={{ width: 60, height: 4, background: theme.border, borderRadius: 2, margin: "4px auto 0" }}>
        <div style={{ width: `${score}%`, height: "100%", background: scoreColor(score), borderRadius: 2, transition: "width 1s" }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Header */}
      <div style={{ padding: "20px 0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Alerts</div>
          <div style={{ color: theme.muted, fontSize: 12 }}>Sightings, CCTV matches & emergency alerts</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: connected ? theme.green : theme.muted }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: connected ? theme.green : theme.muted,
            boxShadow: connected ? `0 0 6px ${theme.green}` : "none",
            display: "inline-block",
          }} />
          {connected ? "LIVE" : "Connecting..."}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: theme.muted, padding: 40 }}>Loading...</div>
      ) : (
        <>
          {/* ── Emergency Alerts (socket broadcast) ──────────── */}
          {emergencyAlerts.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#FF0000" }}>
                🆘 Emergency Alerts ({emergencyAlerts.length})
              </div>
              {emergencyAlerts.map((a, i) => (
                <Card key={i} style={{ marginBottom: 10, borderLeft: `3px solid #FF0000`, background: "#FF000008" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#FF0000" }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace" }}>{a.caseId}</div>
                      <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>📍 {a.location}</div>
                      <div style={{ fontSize: 11, color: theme.muted }}>🕐 {a.receivedAt}</div>
                    </div>
                    <ConfidenceDisplay score={a.confidenceScore || 100} />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#FF0000", fontWeight: 600 }}>
                    🆘 FAMILY NOTIFIED VIA EMAIL & SMS
                  </div>
                </Card>
              ))}
              <div style={{ height: 8 }} />
            </>
          )}

          {/* ── Live CCTV Alerts ─────────────────────────────── */}
          {liveAlerts.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: theme.accent }}>
                🚨 Live CCTV Detections ({liveAlerts.length})
              </div>
              {liveAlerts.map((a, i) => (
                <Card key={i} style={{ marginBottom: 10, borderLeft: `3px solid ${theme.accent}`, background: "#FF4D6D08" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace" }}>{a.caseId}</div>
                      <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>📍 {a.location}</div>
                      <div style={{ fontSize: 11, color: theme.muted }}>🕐 Detected at {a.receivedAt}</div>
                    </div>
                    <ConfidenceDisplay score={a.matchScore} />
                  </div>
                </Card>
              ))}
              <div style={{ height: 8 }} />
            </>
          )}

          {/* ── Confirmed Matches ─────────────────────────────── */}
          {matched.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: theme.green }}>
                ✅ Confirmed Matches ({matched.length})
              </div>
              {matched.map((c, i) => (
                <Card key={i} style={{ marginBottom: 10, borderLeft: `3px solid ${theme.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace" }}>{c.caseId}</div>
                      <div style={{ fontSize: 12, color: theme.muted }}>📍 {c.location}</div>
                      {c.familyMembers?.length > 0 && (
                        <div style={{ fontSize: 11, color: theme.blue, marginTop: 4 }}>
                          👨‍👩‍👧 {c.familyMembers.length} family contact(s) registered
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <span style={{ background: theme.greenSoft, color: theme.green, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        ✓ MATCHED
                      </span>
                      {c.confidenceScore && <ConfidenceDisplay score={c.confidenceScore} />}
                    </div>
                  </div>
                  <Btn
                    variant="danger"
                    small
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={() => sendEmergencyAlert(c)}
                  >
                    {sendingAlert === c._id ? "Sending..." : "🆘 Send Emergency Alert to Family"}
                  </Btn>
                </Card>
              ))}
              <div style={{ height: 8 }} />
            </>
          )}

          {/* ── Sighting Reports ──────────────────────────────── */}
          {alerts.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: theme.yellow }}>
                👁️ Sighting Reports ({alerts.reduce((s, c) => s + c.sightings.length, 0)})
              </div>
              {alerts.map((c, i) =>
                c.sightings.map((s, j) => (
                  <Card key={`${i}-${j}`} style={{ marginBottom: 10, borderLeft: `3px solid ${theme.yellow}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.muted }}>{c.caseId}</div>
                      <span style={{ fontSize: 11, color: theme.yellow, fontWeight: 700 }}>👁️ SIGHTING</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: theme.muted }}>📍 {s.location || "Unknown location"}</div>
                        <div style={{ fontSize: 11, color: theme.muted }}>🕐 {new Date(s.reportedAt).toLocaleString()}</div>
                        {s.source === "cctv" && (
                          <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginTop: 2 }}>📷 AUTO-DETECTED BY CCTV</div>
                        )}
                        {s.alertsSent && (
                          <div style={{ fontSize: 10, color: theme.blue, fontWeight: 600, marginTop: 2 }}>📧 Alerts sent to family</div>
                        )}
                      </div>
                      <ConfidenceDisplay score={s.matchScore || 0} />
                    </div>
                  </Card>
                ))
              )}
            </>
          )}

          {/* ── Active cases with family members (for manual alerts) ── */}
          {cases.filter(c => c.status === "Active" && c.familyMembers?.length > 0).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: theme.blue, marginTop: 8 }}>
                📢 Manual Emergency Alert
              </div>
              {cases.filter(c => c.status === "Active" && c.familyMembers?.length > 0).map((c, i) => (
                <Card key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace" }}>{c.caseId}</div>
                      <div style={{ fontSize: 11, color: theme.blue }}>
                        {c.familyMembers.length} contact(s): {c.familyMembers.map(m => m.name).join(", ")}
                      </div>
                    </div>
                    <Btn variant="danger" small onClick={() => sendEmergencyAlert(c)}>
                      {sendingAlert === c._id ? "..." : "🆘 Alert"}
                    </Btn>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ── Empty state ───────────────────────────────────── */}
          {liveAlerts.length === 0 && emergencyAlerts.length === 0 && alerts.length === 0 && matched.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No Alerts Yet</div>
              <div style={{ color: theme.muted, fontSize: 13 }}>
                Alerts appear automatically when CCTV detects a match or a sighting is reported.
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
