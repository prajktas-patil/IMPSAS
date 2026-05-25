// ============================================================
// screens/AdminScreen.jsx — FIXED: Real API data, Close Case,
//   Delete Case, DB Inspect modal, CCTV tab, Add User
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { theme } from "../theme.js";
import { Card, Btn, StatusBadge } from "../components/UI.jsx";
import { mockModelResults } from "../mockData.js";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const TABS = [
  { id: "cases", label: "Cases" },
  { id: "users", label: "Users" },
  { id: "db",    label: "Database" },
  { id: "cctv",  label: "CCTV" },
  { id: "eval",  label: "Eval" },
];

// ── Add User Modal ─────────────────────────────────────────────
function AddUserModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Officer" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setError("All fields required"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/users/register`, form);
      onAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user");
    }
    setLoading(false);
  };

  const inp = (field, placeholder, type = "text") => (
    <input
      type={type} placeholder={placeholder} value={form[field]}
      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
      style={{
        width: "100%", padding: "10px 12px", background: theme.surface,
        border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text,
        fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, marginBottom: 10, boxSizing: "border-box",
      }}
    />
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000a", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ background: "#0F1120", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>➕ Add New User</div>
        {error && <div style={{ color: theme.accent, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {inp("name", "Full Name")}
        {inp("email", "Email", "email")}
        {inp("password", "Password", "password")}
        <select
          value={form.role}
          onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          style={{
            width: "100%", padding: "10px 12px", background: theme.surface,
            border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text,
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, marginBottom: 16,
          }}
        >
          <option value="Officer">Officer</option>
          <option value="Admin">Admin</option>
        </select>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn style={{ flex: 1 }} onClick={submit} disabled={loading}>
            {loading ? "Adding…" : "Add User"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── DB Inspect Modal ───────────────────────────────────────────
function DbInspectModal({ collection, onClose }) {
  const [docs, setDocs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    axios.get(`${API}/api/db/inspect/${collection}`)
      .then(res => { setDocs(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || "Failed to load"); setLoading(false); });
  }, [collection]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000b", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0F1120", border: `1px solid ${theme.border}`, borderRadius: 16,
        padding: 20, width: "100%", maxWidth: 420, maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
            🗄 {collection}
          </div>
          <Btn small variant="ghost" onClick={onClose}>✕ Close</Btn>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && <div style={{ color: theme.muted, textAlign: "center", padding: 20 }}>Loading…</div>}
          {error   && <div style={{ color: theme.accent, textAlign: "center", padding: 20 }}>{error}</div>}
          {!loading && !error && docs.length === 0 && (
            <div style={{ color: theme.muted, textAlign: "center", padding: 20 }}>No documents found</div>
          )}
          {!loading && docs.map((doc, i) => (
            <div key={i} style={{
              background: theme.surface, borderRadius: 8, padding: 10, marginBottom: 8,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.text,
              wordBreak: "break-all", whiteSpace: "pre-wrap",
            }}>
              {JSON.stringify(doc, null, 2)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AdminScreen() {
  const [tab, setTab]           = useState("cases");
  const [cases, setCases]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [dbStats, setDbStats]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showAddUser, setShowAddUser]     = useState(false);
  const [inspectCol, setInspectCol]       = useState(null);
  const [cctvLog, setCctvLog]   = useState([]);
  const [testLoading, setTestLoading] = useState(false);

  const loadCases = () => {
    axios.get(`${API}/api/cases`)
      .then(res => { setCases(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const loadUsers = () => {
    axios.get(`${API}/api/users`)
      .then(res => setUsers(res.data))
      .catch(() => {});
  };

  const loadDbStats = () => {
    axios.get(`${API}/api/db/stats`)
      .then(res => setDbStats(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadCases();
    loadUsers();
    loadDbStats();
  }, []);

  // ── Close Case (status → Closed) ──
  const handleCloseCase = async (caseDoc) => {
    if (!window.confirm(`Close case for "${caseDoc.name}"? This marks it as resolved.`)) return;
    try {
      await axios.patch(`${API}/api/cases/${caseDoc._id}/status`, { status: "Closed" });
      setCases(prev => prev.map(c => c._id === caseDoc._id ? { ...c, status: "Closed" } : c));
    } catch (err) {
      alert("Failed to close case: " + (err.response?.data?.message || err.message));
    }
  };

  // ── Delete Case (permanent) ──
  const handleDeleteCase = async (caseDoc) => {
    if (!window.confirm(`⚠️ PERMANENTLY delete case "${caseDoc.name}" (${caseDoc.caseId})? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/cases/${caseDoc._id}`);
      setCases(prev => prev.filter(c => c._id !== caseDoc._id));
    } catch (err) {
      alert("Failed to delete: " + (err.response?.data?.message || err.message));
    }
  };

  // ── CCTV Test Alert ──
  const sendTestCctvAlert = async () => {
    if (cases.length === 0) { alert("No cases available to test with."); return; }
    setTestLoading(true);
    const testCase = cases[0];
    try {
      const res = await axios.post(`${API}/api/alerts`, {
        caseId:     testCase.caseId,
        name:       testCase.name,
        matchScore: 82,
        location:   "CCTV Camera #3 - MG Road",
        detectedAt: new Date().toISOString(),
        source:     "cctv_test",
      });
      setCctvLog(prev => [{
        time: new Date().toLocaleTimeString(),
        name: testCase.name,
        caseId: testCase.caseId,
        score: 82,
        location: "CCTV Camera #3 - MG Road",
        status: res.data.success ? "✅ Sent" : "❌ Failed",
      }, ...prev]);
    } catch (err) {
      setCctvLog(prev => [{ time: new Date().toLocaleTimeString(), status: "❌ Error: " + err.message }, ...prev]);
    }
    setTestLoading(false);
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} onAdded={loadUsers} />
      )}
      {inspectCol && (
        <DbInspectModal collection={inspectCol} onClose={() => setInspectCol(null)} />
      )}

      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Admin Panel</div>
        <div style={{ color: theme.muted, fontSize: 12 }}>🛡 Full system control</div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", background: theme.surface,
        borderRadius: 12, padding: 4, marginBottom: 20,
        border: `1px solid ${theme.border}`,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 11,
            background: tab === t.id ? theme.gradient : "transparent",
            color: tab === t.id ? "#fff" : theme.muted,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cases Tab ── */}
      {tab === "cases" && (
        <div className="fade-in">
          <div style={{ color: theme.muted, fontSize: 12, marginBottom: 12 }}>
            {cases.length} total cases in database
          </div>
          {loading && <div style={{ textAlign: "center", color: theme.muted, padding: 30 }}>Loading…</div>}
          {!loading && cases.length === 0 && (
            <Card style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ color: theme.muted }}>No cases found</div>
            </Card>
          )}
          {!loading && cases.map((c) => (
            <Card key={c._id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.muted }}>
                    {c.caseId}
                  </div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{c.location} · Age {c.age}</div>
                </div>
                <StatusBadge status={c.status?.toLowerCase()} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="ghost" style={{ flex: 1 }}>👁 View</Btn>
                {c.status !== "Closed" && (
                  <Btn small variant="secondary" style={{ flex: 1 }} onClick={() => handleCloseCase(c)}>
                    ✅ Close
                  </Btn>
                )}
                <Btn small variant="danger" style={{ flex: 1 }} onClick={() => handleDeleteCase(c)}>
                  🗑 Delete
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Users Tab ── */}
      {tab === "users" && (
        <div className="fade-in">
          {users.length === 0 && (
            <div style={{ color: theme.muted, fontSize: 12, marginBottom: 12 }}>Loading users…</div>
          )}
          {users.map((u, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: theme.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {u.role === "Admin" ? "🛡" : "👮"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>{u.role} · {u.email}</div>
                </div>
                <Btn small variant="ghost">Edit</Btn>
              </div>
            </Card>
          ))}
          <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => setShowAddUser(true)}>
            + Add User
          </Btn>
        </div>
      )}

      {/* ── Database Tab ── */}
      {tab === "db" && (
        <div className="fade-in">
          <Card style={{ marginBottom: 12, background: dbStats ? "#00E5A011" : "#FF4D6D11", border: `1px solid ${dbStats ? theme.green : theme.accent}33` }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: dbStats ? theme.green : theme.accent, marginBottom: 4 }}>
              {dbStats ? "🟢 MongoDB Connected" : "🔴 Connecting…"}
            </div>
            <div style={{ fontSize: 11, color: theme.muted }}>
              {dbStats?.uri || "Fetching connection…"}
            </div>
          </Card>

          {!dbStats && (
            <Card style={{ textAlign: "center", padding: 20 }}>
              <div style={{ color: theme.muted }}>Loading database stats…</div>
            </Card>
          )}

          {dbStats?.collections?.map((d, i) => (
            <Card key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{d.collection}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>
                    {d.count} docs · {d.size} · {d.indexes} index(es)
                  </div>
                </div>
                <Btn small variant="ghost" onClick={() => setInspectCol(d.collection)}>
                  🔍 Inspect
                </Btn>
              </div>
            </Card>
          ))}

          <Btn variant="ghost" style={{ width: "100%", marginTop: 8 }} onClick={loadDbStats}>
            🔄 Refresh Stats
          </Btn>
        </div>
      )}

      {/* ── CCTV Tab ── */}
      {tab === "cctv" && (
        <div className="fade-in">
          <Card style={{ marginBottom: 16, background: "#7C3AED11", border: "1px solid #7C3AED44" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🎥 CCTV Module</div>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
              Simulates a CCTV face-match alert sent to the backend. Real usage: run <span style={{ fontFamily: "monospace", color: theme.blue }}>match.py</span> on your camera feed.
            </div>
            <Btn style={{ width: "100%" }} onClick={sendTestCctvAlert} disabled={testLoading}>
              {testLoading ? "Sending…" : "📡 Send Test CCTV Alert"}
            </Btn>
          </Card>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Alert Log</div>
          {cctvLog.length === 0 && (
            <div style={{ color: theme.muted, fontSize: 12, textAlign: "center", padding: 20 }}>
              No alerts sent yet. Click the button above to test.
            </div>
          )}
          {cctvLog.map((log, i) => (
            <Card key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{log.name || "—"}</div>
                <div style={{ fontSize: 11, color: theme.muted }}>{log.time}</div>
              </div>
              {log.caseId && <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.muted }}>{log.caseId}</div>}
              {log.location && <div style={{ fontSize: 11, color: theme.muted }}>{log.location}</div>}
              <div style={{ fontSize: 12, marginTop: 4, color: log.status?.startsWith("✅") ? theme.green : theme.accent }}>
                {log.status}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Evaluation Tab ── */}
      {tab === "eval" && (
        <div className="fade-in">
          <div style={{ fontWeight: 600, marginBottom: 12 }}>📊 Model Evaluation Results</div>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 16 }}>
            Dataset: 10 identities × 5 images · Threshold: 0.6
          </div>
          {mockModelResults.map((m, i) => (
            <Card key={i} style={{
              marginBottom: 10,
              border: i === 0 ? `1px solid ${theme.green}44` : `1px solid ${theme.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: i === 0 ? theme.green : theme.text }}>
                  {m.model}
                </div>
                {i === 0 && (
                  <span style={{ fontSize: 10, color: theme.green, fontWeight: 700, background: "#00E5A011", padding: "2px 8px", borderRadius: 10 }}>
                    BEST MODEL
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {[
                  { label: "Accuracy",  val: m.acc },
                  { label: "Precision", val: m.prec },
                  { label: "Recall",    val: m.rec },
                  { label: "F1 Score",  val: m.f1 },
                ].map((item, j) => (
                  <div key={j} style={{ textAlign: "center", background: theme.surface, borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: i === 0 ? theme.green : theme.text }}>
                      {item.val}%
                    </div>
                    <div style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
