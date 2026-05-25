// ============================================================
// screens/CasesScreen.jsx — Live cases from MongoDB
// ============================================================

import { useState, useEffect } from "react";
import axios from "axios";
import { theme } from "../theme.js";
import { Card, Btn, StatusBadge, ConfidenceBar } from "../components/UI.jsx";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const FILTERS = ["all", "active", "matched", "closed"];

export default function CasesScreen({ onNav }) {
  const [filter, setFilter] = useState("all");
  const [cases, setCases]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/cases`)
      .then(res => { setCases(res.data); setLoading(false); })
      .catch(err => { console.error("API Error:", err); setLoading(false); });
  }, []);

  const filtered = filter === "all"
    ? cases
    : cases.filter(c => c.status?.toLowerCase() === filter.toLowerCase());

  const scoreColor = (s) => s >= 75 ? theme.green : s >= 55 ? theme.yellow : theme.accent;

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Page Header */}
      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>All Cases</div>
        <div style={{ color: theme.muted, fontSize: 12 }}>
          MongoDB · {cases.length} total records
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {FILTERS.map(f => (
          <button
            key={f} onClick={() => setFilter(f)}
            style={{
              whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 20,
              border: `1px solid ${filter === f ? theme.blue : theme.border}`,
              background: filter === f ? theme.blueSoft : "transparent",
              color: filter === f ? theme.blue : theme.muted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", color: theme.muted, padding: 40 }}>Loading...</div>
      )}

      {/* Case Cards */}
      {!loading && filtered.length === 0 && (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No Cases Found</div>
          <div style={{ color: theme.muted, fontSize: 13, marginBottom: 16 }}>
            {filter === "all" ? "No cases registered yet." : `No ${filter} cases.`}
          </div>
          <Btn onClick={() => onNav("register")}>+ Register New Case</Btn>
        </Card>
      )}

      {!loading && filtered.map((c) => (
        <Card key={c._id} style={{ marginBottom: 12 }} onClick={() => onNav("matches")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>
              {c.age < 18 ? "👦" : c.gender === "Female" ? "👩" : "👨"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.muted }}>
                {c.caseId || c._id?.slice(-6)}
              </div>
            </div>
            <StatusBadge status={c.status?.toLowerCase()} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Age",      value: c.age ? `${c.age} yrs` : "N/A" },
              { label: "Location", value: c.location || "Unknown" },
              { label: "Gender",   value: c.gender || "N/A" },
              { label: "Sightings", value: c.sightings?.length || 0 },
            ].map((item, j) => (
              <div key={j} style={{ background: theme.surface, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: theme.muted, letterSpacing: 0.5 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Confidence Score bar if available */}
          {c.confidenceScore != null && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: theme.muted }}>Confidence Score</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(c.confidenceScore), fontFamily: "'JetBrains Mono',monospace" }}>
                  {c.confidenceScore}%
                </span>
              </div>
              <ConfidenceBar value={c.confidenceScore} />
            </div>
          )}

          {/* Family contacts badge */}
          {c.familyMembers?.length > 0 && (
            <div style={{ fontSize: 11, color: theme.blue, marginTop: 4 }}>
              👨‍👩‍👧 {c.familyMembers.length} family contact(s) · alerts enabled
            </div>
          )}
        </Card>
      ))}

      {!loading && (
        <Btn onClick={() => onNav("register")} style={{ width: "100%", marginTop: 8 }}>
          + Register New Case
        </Btn>
      )}
    </div>
  );
}
