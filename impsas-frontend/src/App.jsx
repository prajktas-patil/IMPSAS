import { useState } from "react";
import { globalStyles } from "./theme.js";
import { Header, NavBar } from "./components/Layout.jsx";
import LoginScreen     from "./screens/LoginScreen.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import CasesScreen     from "./screens/CasesScreen.jsx";
import RegisterScreen  from "./screens/RegisterScreen.jsx";
import SearchScreen    from "./screens/SearchScreen.jsx";
import MatchesScreen   from "./screens/MatchesScreen.jsx";
import LocationScreen  from "./screens/LocationScreen.jsx";
import AdminScreen     from "./screens/AdminScreen.jsx";
import AlertsScreen    from "./screens/AlertsScreen.jsx";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [role, setRole]     = useState(null);   // "public" | "officer" | "admin"
  const [userName, setUserName] = useState("");

  const handleLogin  = (r, name) => { setRole(r); setUserName(name || ""); setScreen("dashboard"); };
  const handleLogout = () => { setRole(null); setUserName(""); setScreen("login"); };

  const navTo = (s) => {
    // Admin-only screen
    if (s === "admin" && role !== "admin") {
      alert("⛔ Admin access only."); return;
    }
    // Public users cannot access matches/alerts (officer+ only)
    if ((s === "matches" || s === "alerts") && role === "public") {
      alert("⛔ Officer access required."); return;
    }
    setScreen(s);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#0A0C14", position: "relative", overflow: "hidden" }}>
        {screen === "login" ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <>
            <Header screen={screen} onNav={navTo} role={role} userName={userName} onLogout={handleLogout} />
            <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
              {screen === "dashboard" && <DashboardScreen onNav={navTo} role={role} userName={userName} />}
              {screen === "cases"     && <CasesScreen     onNav={navTo} />}
              {screen === "register"  && <RegisterScreen  onNav={navTo} />}
              {screen === "search"    && <SearchScreen    onNav={navTo} />}
              {screen === "location"  && <LocationScreen  onNav={navTo} />}

              {/* Officer + Admin only */}
              {screen === "matches" && (role === "officer" || role === "admin") && <MatchesScreen onNav={navTo} />}
              {screen === "alerts"  && (role === "officer" || role === "admin") && <AlertsScreen  onNav={navTo} />}

              {/* Admin only */}
              {screen === "admin" && role === "admin" && <AdminScreen onNav={navTo} />}
              {screen === "admin" && role !== "admin" && (
                <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⛔</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>Access Denied</div>
                  <div style={{ fontSize: 13 }}>Admin privileges required.</div>
                </div>
              )}

              {/* Public blocked screens */}
              {(screen === "matches" || screen === "alerts") && role === "public" && (
                <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>Officer Access Only</div>
                  <div style={{ fontSize: 13 }}>This section is restricted to officers and admins.</div>
                </div>
              )}
            </div>
            <NavBar current={screen} onNav={navTo} role={role} />
          </>
        )}
      </div>
    </>
  );
}