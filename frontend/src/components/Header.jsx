import { useNavigate, useLocation } from "react-router-dom";

export default function Header({ stockCount }) {
  const nav = useNavigate();
  const loc = useLocation();

  const pill = (path, label) => {
    const active = loc.pathname === path;
    return (
      <button
        onClick={() => nav(path)}
        style={{
          padding: "7px 16px", borderRadius: 20, fontSize: 12,
          fontFamily: "var(--mono)", cursor: "pointer",
          border: active ? "1px solid var(--verde)" : "1px solid var(--verde-border)",
          background: active ? "var(--verde-dim)" : "transparent",
          color: active ? "var(--verde)" : "var(--sub)",
          transition: "all 0.2s",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 28px",
      background: "rgba(8,13,8,0.92)",
      borderBottom: "1px solid var(--borde)",
      backdropFilter: "blur(12px)",
    }}>
      <div
        onClick={() => nav("/")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <span style={{ fontSize: 24 }}>🐄</span>
        <span style={{
          fontSize: 20, fontWeight: 900, letterSpacing: "0.15em",
          fontFamily: "var(--mono)", color: "var(--texto)",
        }}>
          GANADR<span style={{ color: "var(--verde)" }}>IA</span>
        </span>
      </div>
      <nav style={{ display: "flex", gap: 10 }}>
        {pill("/analizar", "+ Analizar")}
        {pill("/stock", `Stock (${stockCount})`)}
      </nav>
    </header>
  );
}
