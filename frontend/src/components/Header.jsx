import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header({ stockCount, tieneCampo }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/analizar", label: "＋ Analizar" },
    { path: "/stock",   label: `📋 Stock (${stockCount})` },
    { path: "/campo",   label: "🌾 Mi Campo", alert: !tieneCampo },
  ];

  const pill = ({ path, label, alert = false }) => {
    const active = loc.pathname === path;
    return (
      <button key={path} onClick={() => { nav(path); setMenuOpen(false); }} style={{
        padding: "10px 20px", borderRadius: 8, fontSize: 15, fontWeight: active ? 700 : 500,
        border: active ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
        background: active ? "#dcfce7" : "#fff",
        color: active ? "#166534" : "#374151",
        cursor: "pointer", position: "relative",
        boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
        whiteSpace: "nowrap",
      }}>
        {label}
        {alert && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", border: "2px solid #fff" }} />}
      </button>
    );
  };

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 20px",
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}>
        <div onClick={() => nav("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐄</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", fontFamily: "Georgia, serif" }}>
              Ganadr<span style={{ color: "#16a34a" }}>IA</span>
            </div>
            <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              Gestión Inteligente
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 10 }} className="desktop-nav">
          {navItems.map(pill)}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-menu-btn"
          style={{
            background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8,
            padding: "8px 12px", fontSize: 20, cursor: "pointer", color: "#374151",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-nav" style={{
          position: "fixed", top: 61, left: 0, right: 0, zIndex: 99,
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {navItems.map(item => {
            const active = loc.pathname === item.path;
            return (
              <button key={item.path} onClick={() => { nav(item.path); setMenuOpen(false); }} style={{
                padding: "14px 20px", borderRadius: 10, fontSize: 16, fontWeight: active ? 700 : 500,
                border: active ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
                background: active ? "#dcfce7" : "#f8fafc",
                color: active ? "#166534" : "#374151",
                cursor: "pointer", textAlign: "left", position: "relative",
              }}>
                {item.label}
                {item.alert && <span style={{ position: "absolute", top: 8, right: 14, fontSize: 12, color: "#d97706", fontWeight: 700 }}>⚠️ Sin configurar</span>}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
