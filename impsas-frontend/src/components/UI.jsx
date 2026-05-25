// ============================================================
// components/UI.jsx — Reusable base UI components
// StatusBadge, ConfidenceBar, Card, Btn, Input
// ============================================================

import { theme } from "../theme.js";

export function StatusBadge({ status }) {
  const map = {
    active:  { color: theme.yellow, bg: theme.yellowSoft, label: "● Active" },
    matched: { color: theme.green,  bg: theme.greenSoft,  label: "✓ Matched" },
    closed:  { color: theme.muted,  bg: "#6B729922",      label: "✗ Closed" },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

export function ConfidenceBar({ value, max = 100 }) {
  const pct = (value / max) * 100;
  const color = pct > 75 ? theme.green : pct > 50 ? theme.yellow : theme.accent;
  return (
    <div style={{
      width: "100%", background: theme.border,
      borderRadius: 4, height: 6, overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`, background: color,
        height: "100%", borderRadius: 4,
        transition: "width 1s ease",
      }} />
    </div>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: 16,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", style = {}, small = false }) {
  const variants = {
    primary:   { background: theme.gradient,   color: "#fff",       border: "none" },
    secondary: { background: "transparent",    color: theme.blue,   border: `1px solid ${theme.blue}` },
    ghost:     { background: "transparent",    color: theme.muted,  border: `1px solid ${theme.border}` },
    danger:    { background: "#FF4D6D22",      color: theme.accent, border: `1px solid ${theme.accent}` },
    success:   { background: "#00E5A022",      color: theme.green,  border: `1px solid ${theme.green}` },
  };
  return (
    <button
      onClick={onClick}
      style={{
        ...variants[variant],
        borderRadius: 12,
        padding: small ? "6px 14px" : "12px 20px",
        fontSize: small ? 12 : 14,
        fontWeight: 600, cursor: "pointer",
        fontFamily: "'Space Grotesk',sans-serif",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Input({ label, type = "text", value, onChange, placeholder, icon }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{
          fontSize: 12, color: theme.muted,
          marginBottom: 6, fontWeight: 600, letterSpacing: 0.5,
        }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 12,
            top: "50%", transform: "translateY(-50%)", fontSize: 16,
          }}>
            {icon}
          </span>
        )}
        <input
          type={type} value={value}
          onChange={onChange} placeholder={placeholder}
          style={{
            width: "100%", background: theme.surface,
            border: `1px solid ${theme.border}`, borderRadius: 12,
            padding: icon ? "12px 12px 12px 40px" : "12px 14px",
            color: theme.text, fontSize: 14,
            fontFamily: "'Space Grotesk',sans-serif", outline: "none",
          }}
        />
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <span
      className="spinner"
      style={{
        display: "inline-block", width: 14, height: 14,
        border: "2px solid #fff", borderTop: "2px solid transparent",
        borderRadius: "50%",
      }}
    />
  );
}
