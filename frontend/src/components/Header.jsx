import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header({ stockCount, tieneCampo, user, onLogout }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/analizar", label: "＋ Analizar" },
    { path: "/stock",    label: `📋 Stock (${stockCount})` },
    { path: "/lotes",    label: "🗂️ Lotes" },
    { path: "/liniers",  label: "🏛️ Liniers" },
    { path: "/clima",    label: "🌦️ Clima" },
    { path: "/campo",    label: "🌾 Campo", alert: !tieneCampo },
  ];

  const pill = ({ path, label, alert = false }) => {
    const active = loc.pathname === path;
    return (
      <button key={path} onClick={() => { nav(path); setMenuOpen(false); }} style={{
        padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
        border: active ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
        background: active ? "#dcfce7" : "#fff",
        color: active ? "#166534" : "#374151",
        cursor: "pointer", position: "relative",
        boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
        whiteSpace: "nowrap",
      }}>
        {label}
        {alert && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", border: "2px solid #fff" }} />}
      </button>
    );
  };

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "11px 20px", background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        gap: 10,
      }}>
        <div onClick={() => nav("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>🐄</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", fontFamily: "Georgia, serif", lineHeight: 1 }}>
              Ganadr<span style={{ color: "#16a34a" }}>IA</span>
            </div>
            <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Gestión Inteligente</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, justifyContent: "center", flexWrap: "nowrap" }} className="desktop-nav">
          {navItems.map(pill)}
        </nav>

        {/* User + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} className="desktop-nav">
          <div style={{ padding: "5px 12px", borderRadius: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 12, color: "#166534", fontWeight: 700, whiteSpace: "nowrap" }}>
            👤 {user?.username}
          </div>
          <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
            Salir
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{
          background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8,
          padding: "7px 11px", fontSize: 18, cursor: "pointer", color: "#374151",
        }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-nav" style={{
          position: "fixed", top: 59, left: 0, right: 0, zIndex: 99,
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {navItems.map(item => {
            const active = loc.pathname === item.path;
            return (
              <button key={item.path} onClick={() => { nav(item.path); setMenuOpen(false); }} style={{
                padding: "13px 18px", borderRadius: 10, fontSize: 15, fontWeight: active ? 700 : 500,
                border: active ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
                background: active ? "#dcfce7" : "#f8fafc",
                color: active ? "#166534" : "#374151",
                cursor: "pointer", textAlign: "left",
              }}>
                {item.label}
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>👤 {user?.username}</span>
            <button onClick={() => { onLogout(); setMenuOpen(false); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 14 }}>Salir</button>
          </div>
        </div>
      )}
    </>
  );
}
