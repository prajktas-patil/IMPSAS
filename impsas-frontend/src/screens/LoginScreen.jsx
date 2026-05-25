// screens/LoginScreen.jsx — Real API login (MongoDB)
import { useState } from "react";
import { theme } from "../theme.js";
import { Btn } from "../components/UI.jsx";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode]           = useState("signin"); // signin | signup | role
  const [username, setUsername]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [name, setName]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [roleType, setRoleType]   = useState("officer");

  const reset = () => {
    setUsername(""); setEmail(""); setPassword("");
    setConfirmPass(""); setName(""); setError("");
  };

  // ── Public Sign Up → POST /api/users/register ─────────────────
  const handleSignUp = async () => {
    if (!name || !email || !password) { setError("All fields are required."); return; }
    if (password !== confirmPass)     { setError("Passwords do not match."); return; }
    if (password.length < 6)          { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password, role: "Public" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      // Auto login after sign up
      await doLogin(email, password, "public", name);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Public Sign In → POST /api/users/login ───────────────────
  const handleSignIn = async () => {
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true);
    try {
      await doLogin(email, password, null, null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Staff / Role Login → POST /api/users/login ───────────────
  const handleRoleLogin = async () => {
    if (!username || !password) { setError("Please enter credentials."); return; }
    setLoading(true);
    // Staff login uses email field = username@impsas.local convention
    // OR just use the email directly — staff accounts are seeded with real emails
    try {
      await doLogin(username, password, null, null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Shared login helper ───────────────────────────────────────
  const doLogin = async (emailOrUsername, pass, forceRole, forceName) => {
    const res = await fetch(`${API}/api/users/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: emailOrUsername, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Invalid credentials");

    // Store token for API calls in this session
    sessionStorage.setItem("impsas_token", data.token);
    sessionStorage.setItem("impsas_user",  JSON.stringify(data.user));

    const role = forceRole || data.user.role?.toLowerCase() || "public";
    const displayName = forceName || data.user.name || "User";
    setLoading(false);
    onLogin(role, displayName);
  };

  const inputStyle = {
    width: "100%", background: theme.surface,
    border: `1px solid ${theme.border}`, borderRadius: 12,
    padding: "12px 14px", color: theme.text, fontSize: 14,
    fontFamily: "'Space Grotesk',sans-serif", outline: "none",
    marginBottom: 12, boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, #FF4D6D22, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #4D9FFF22, transparent 70%)" }} />

      <div className="slide-up" style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: theme.gradient,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 12, boxShadow: "0 8px 32px #FF4D6D44",
          }}>🔍</div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 22, letterSpacing: 2,
            background: theme.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>IMPSAS</div>
          <div style={{ color: theme.muted, fontSize: 11, marginTop: 4, letterSpacing: 1 }}>
            MISSING PERSON SEARCH SYSTEM
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: "flex", background: theme.surface, borderRadius: 12,
          padding: 4, marginBottom: 20, border: `1px solid ${theme.border}`,
        }}>
          {[
            { id: "signin", label: "Sign In" },
            { id: "signup", label: "Sign Up" },
            { id: "role",   label: "🛡 Staff" },
          ].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); reset(); }} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12,
              background: mode === t.id ? theme.gradient : "transparent",
              color: mode === t.id ? "#fff" : theme.muted,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SIGN IN ── */}
        {mode === "signin" && (
          <div className="fade-in">
            <div style={{ color: theme.muted, fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              Welcome back! Sign in to your account.
            </div>
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignIn()} />
            {error && <div style={{ color: theme.accent, fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
            <Btn onClick={handleSignIn} style={{ width: "100%", padding: 14 }}>
              {loading ? <span className="spinner" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} /> : "Sign In →"}
            </Btn>
            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: theme.muted }}>
              No account?{" "}
              <span onClick={() => { setMode("signup"); reset(); }} style={{ color: theme.blue, cursor: "pointer", fontWeight: 600 }}>
                Create one
              </span>
            </div>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {mode === "signup" && (
          <div className="fade-in">
            <div style={{ color: theme.muted, fontSize: 12, marginBottom: 16, textAlign: "center" }}>
              Create a free account to help find missing persons.
            </div>
            <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Password (min 6 chars)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <input style={inputStyle} placeholder="Confirm Password" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            {error && <div style={{ color: theme.accent, fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
            <Btn onClick={handleSignUp} style={{ width: "100%", padding: 14 }}>
              {loading ? <span className="spinner" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} /> : "Create Account →"}
            </Btn>
          </div>
        )}

        {/* ── STAFF / ROLE LOGIN ── */}
        {mode === "role" && (
          <div className="fade-in">
            <div style={{
              display: "flex", background: theme.surface, borderRadius: 12,
              padding: 4, marginBottom: 14, border: `1px solid ${theme.border}`,
            }}>
              {["officer", "admin"].map(r => (
                <button key={r} onClick={() => { setRoleType(r); reset(); }} style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13,
                  background: roleType === r ? theme.gradient : "transparent",
                  color: roleType === r ? "#fff" : theme.muted,
                }}>
                  {r === "officer" ? "👮 Officer" : "🛡 Admin"}
                </button>
              ))}
            </div>

            <div style={{
              background: roleType === "admin" ? "#FF4D6D11" : "#4D9FFF11",
              border: `1px solid ${roleType === "admin" ? theme.accent + "44" : theme.blue + "44"}`,
              borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 11,
              color: roleType === "admin" ? theme.accent : theme.blue,
            }}>
              {roleType === "admin"
                ? "🛡 Full access: manage cases, delete, admin panel"
                : "👮 Officer access: all features except admin panel"}
            </div>

            {/* Staff use their email as username */}
            <input style={inputStyle} placeholder="Email" type="email" value={username} onChange={e => setUsername(e.target.value)} />
            <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRoleLogin()} />

            <div style={{ fontSize: 11, color: theme.muted, marginBottom: 12, textAlign: "center" }}>
              Use seeded credentials — run <code style={{ background: theme.surface, padding: "1px 5px", borderRadius: 4 }}>node seed.js</code> once to create them
            </div>

            {error && <div style={{ color: theme.accent, fontSize: 12, marginBottom: 10 }}>⚠️ {error}</div>}
            <Btn onClick={handleRoleLogin} style={{ width: "100%", padding: 14 }}>
              {loading ? <span className="spinner" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} /> : "Staff Login →"}
            </Btn>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, color: theme.muted, fontSize: 11 }}>
          🔒 Secure · Role-based access · IMPSAS v1.0
        </div>
      </div>
    </div>
  );
}