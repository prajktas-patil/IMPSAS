// ============================================================
// components/Layout.jsx — Header & NavBar shell components
// ============================================================

import { theme } from "../theme.js";

const SCREEN_TITLES = {
  dashboard: "Dashboard",
  cases:     "Cases",
  register:  "Register Case",
  search:    "Face Search",
  matches:   "Match Review",
  location:  "Location Map",
  admin:     "Admin Panel",
  alerts:    "Alerts",
};

export function Header({ screen, onNav, role, onLogout }) {
  return (
    <div style={{
      background: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
      padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14,
          background: theme.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          IMPSAS
        </div>
        <span style={{ color: theme.border }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {SCREEN_TITLES[screen] || screen}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onNav("location")}
          style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}
        >🗺</button>

        {role === "admin" && (
          <button
            onClick={() => onNav("admin")}
            style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}
          >⚙️</button>
        )}

        <button
          onClick={onLogout}
          style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: theme.muted }}
        >⏻</button>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "cases",     icon: "📋", label: "Cases" },
  { id: "search",    icon: "🔍", label: "Search" },
  { id: "matches",   icon: "🎯", label: "Matches" },
  { id: "alerts",    icon: "🔔", label: "Alerts" },
];

export function NavBar({ current, onNav }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: theme.surface, borderTop: `1px solid ${theme.border}`,
      display: "flex", justifyContent: "space-around",
      padding: "8px 0 20px", zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onNav(item.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 12px", borderRadius: 10, transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
            color: current === item.id ? theme.accent : theme.muted,
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {item.label}
          </span>
          {current === item.id && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: theme.accent }} />
          )}
        </button>
      ))}
    </div>
  );
}
