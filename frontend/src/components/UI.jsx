import React from "react";
import { formatPesos } from "../utils/helpers.js";

// ── NOTIFICACIÓN ─────────────────────────────────────────────────────────────
export function Notif({ notif }) {
  if (!notif) return null;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      padding: "12px 28px", borderRadius: 8, zIndex: 9999,
      background: notif.tipo === "error" ? "#dc2626" : "#16a34a",
      color: "#fff", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600,
      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      animation: "fadeIn 0.3s ease", whiteSpace: "nowrap",
    }}>
      {notif.msg}
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--borde)",
      borderRadius: "var(--radius)",
      padding: "24px",
      marginBottom: 16,
      boxShadow: "var(--shadow)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── CHIP SELECTOR ─────────────────────────────────────────────────────────────
export function ChipGrid({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 14,
            fontFamily: "var(--mono)", cursor: "pointer", fontWeight: value === opt.id ? 600 : 400,
            border: value === opt.id ? "2px solid var(--verde)" : "1.5px solid #cbd5e1",
            background: value === opt.id ? "var(--verde-dim)" : "#fff",
            color: value === opt.id ? "#166534" : "var(--sub)",
            transition: "all 0.15s",
          }}
        >
          {opt.icon && `${opt.icon} `}{opt.label}
        </button>
      ))}
    </div>
  );
}

// ── LABEL ─────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return (
    <span style={{
      display: "block", fontSize: 12, color: "var(--sub)", fontWeight: 600,
      fontFamily: "var(--mono)", letterSpacing: "0.05em",
      textTransform: "uppercase", marginBottom: 8,
    }}>
      {children}
    </span>
  );
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
export function Input({ style = {}, ...props }) {
  return (
    <input
      style={{
        width: "100%", padding: "11px 14px", fontSize: 15,
        marginBottom: 18, borderRadius: 8, display: "block",
        ...style,
      }}
      {...props}
    />
  );
}

// ── BOTONES ───────────────────────────────────────────────────────────────────
export function BtnPrimary({ children, style = {}, ...props }) {
  return (
    <button
      style={{
        padding: "11px 24px", borderRadius: 8, fontSize: 15, fontWeight: 600,
        border: "none", background: "#16a34a", color: "#fff",
        cursor: "pointer", letterSpacing: "0.01em",
        boxShadow: "0 1px 3px rgba(22,163,74,0.3)",
        transition: "all 0.15s",
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
      onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, style = {}, ...props }) {
  return (
    <button
      style={{
        padding: "11px 24px", borderRadius: 8, fontSize: 15, fontWeight: 500,
        border: "1.5px solid #cbd5e1", background: "#fff", color: "var(--sub)",
        cursor: "pointer", transition: "all 0.15s",
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#fff"; }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── SECTION TITLE ─────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: "#16a34a",
      letterSpacing: "0.12em", textTransform: "uppercase",
      marginBottom: 16, paddingBottom: 10,
      borderBottom: "2px solid #dcfce7",
    }}>
      {children}
    </div>
  );
}

// ── METRICA CARD ──────────────────────────────────────────────────────────────
export function MetricaCard({ titulo, valor, sub, color = "#16a34a" }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--borde)",
      borderRadius: 10, padding: "16px 14px", textAlign: "center",
      boxShadow: "var(--shadow)",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--sub2)" }}>{sub}</div>}
    </div>
  );
}

// ── BARRA PROYECCIÓN ──────────────────────────────────────────────────────────
export function ProyBar({ label, kg, maxKg, color }) {
  const pct = maxKg > 0 ? Math.round((kg / maxKg) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--sub)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--texto)" }}>{kg} kg</span>
      </div>
      <div style={{ height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 5, transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

// ── STEPPER ───────────────────────────────────────────────────────────────────
export function Stepper({ paso }) {
  const pasos = [{ n: 1, label: "Foto" }, { n: 2, label: "Datos" }, { n: 3, label: "Resultado" }];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
      {pasos.map((p, i) => (
        <React.Fragment key={p.n}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, margin: "0 auto 4px",
              background: paso > p.n ? "#16a34a" : paso === p.n ? "#16a34a" : "#e2e8f0",
              color: paso >= p.n ? "#fff" : "#94a3b8",
              border: paso === p.n ? "3px solid #bbf7d0" : "none",
              boxShadow: paso === p.n ? "0 0 0 2px #16a34a" : "none",
            }}>
              {paso > p.n ? "✓" : p.n}
            </div>
            <div style={{ fontSize: 11, color: paso >= p.n ? "#16a34a" : "var(--sub2)", fontWeight: paso === p.n ? 700 : 400 }}>
              {p.label}
            </div>
          </div>
          {i < pasos.length - 1 && (
            <div style={{ flex: 1, height: 2, background: paso > p.n ? "#16a34a" : "#e2e8f0", margin: "0 8px 20px" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%", margin: "0 auto",
      border: "4px solid #e2e8f0",
      borderTopColor: "#16a34a",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}
