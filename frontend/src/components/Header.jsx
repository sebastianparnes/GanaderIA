import { useNavigate, useLocation } from "react-router-dom";

export default function Header({ stockCount, tieneCampo }) {
  const nav = useNavigate();
  const loc = useLocation();

  const pill = (path, label, alert = false) => {
    const active = loc.pathname === path;
    return (
      <button
        onClick={() => nav(path)}
        style={{
          padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 500,
          fontFamily: "var(--mono)", cursor: "pointer", position: "relative",
          border: active ? "2px solid #16a34a" : "1.5px solid #e2e8f0",
          background: active ? "#dcfce7" : "#fff",
          color: active ? "#166534" : "#64748b",
          transition: "all 0.15s",
          boxShadow: active ? "none" : "var(--shadow)",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "#94a3b8"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#e2e8f0"; }}
      >
        {label}
        {alert && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 10, height: 10, borderRadius: "50%",
            background: "#f59e0b", border: "2px solid #fff",
          }} />
        )}
      </button>
    );
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 32px",
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div onClick={() => nav("/")} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: "#dcfce7",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>🐄</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.05em", color: "#1e293b", fontFamily: "Georgia, serif" }}>
            Ganadr<span style={{ color: "#16a34a" }}>IA</span>
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            Gestión Ganadera Inteligente
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {pill("/analizar", "+ Analizar Animal")}
        {pill("/stock", `📋 Stock (${stockCount})`)}
        {pill("/campo", "🌾 Mi Campo", !tieneCampo)}
      </nav>
    </header>
  );
}
