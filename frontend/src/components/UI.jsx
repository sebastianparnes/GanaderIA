import React from "react";
import { formatPesos } from "../utils/helpers.js";

// ── NOTIFICACIÓN ─────────────────────────────────────────────────────────────
export function Notif({ notif }) {
  if (!notif) return null;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      padding: "10px 24px", borderRadius: 8, zIndex: 9999,
      background: notif.tipo === "error" ? "#dc2626" : "#16a34a",
      color: "#fff", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      animation: "fadeIn 0.3s ease",
      whiteSpace: "nowrap",
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
            padding: "7px 14px", borderRadius: 20, fontSize: 13,
            fontFamily: "var(--mono)", cursor: "pointer",
            border: value === opt.id ? "1px solid var(--verde)" : "1px solid var(--verde-border)",
            background: value === opt.id ? "var(--verde-dim)" : "rgba(74,222,128,0.02)",
            color: value === opt.id ? "var(--verde)" : "var(--sub)",
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
      display: "block", fontSize: 11, color: "var(--sub)",
      fontFamily: "var(--mono)", letterSpacing: "0.1em",
      textTransform: "uppercase", marginBottom: 10,
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
        width: "100%", padding: "11px 14px",
        fontSize: 15, marginBottom: 18,
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
        padding: "12px 28px", borderRadius: 8,
        background: "var(--verde)", color: "#080d08",
        border: "none", fontSize: 14, fontWeight: 700,
        fontFamily: "var(--mono)", letterSpacing: "0.05em",
        ...style,
      }}
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
        padding: "12px 24px", borderRadius: 8,
        background: "transparent", color: "var(--sub)",
        border: "1px solid rgba(148,163,184,0.25)",
        fontSize: 13, fontFamily: "var(--mono)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── SECCIÓN TÍTULO ────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.12em",
      color: "var(--sub)", marginBottom: 16, textTransform: "uppercase",
    }}>
      {children}
    </h3>
  );
}

// ── MÉTRICA CARD ──────────────────────────────────────────────────────────────
export function MetricaCard({ titulo, valor, sub, color }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--borde)",
      borderTop: `3px solid ${color}`, borderRadius: 12,
      padding: "18px 14px", textAlign: "center",
    }}>
      <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "var(--mono)", color, marginBottom: 4 }}>
        {valor}
      </div>
      <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {titulo}
      </div>
      {sub && <div style={{ fontSize: 10, color: "var(--sub2)", marginTop: 4, fontFamily: "var(--mono)" }}>{sub}</div>}
    </div>
  );
}

// ── RESUMEN CAPITAL ───────────────────────────────────────────────────────────
export function ResumenCard({ titulo, valor, sub, color }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--borde)",
      borderLeft: `4px solid ${color}`, borderRadius: 12,
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--mono)", color }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--sub2)", marginTop: 4, fontFamily: "var(--mono)" }}>{sub}</div>}
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "3px solid rgba(74,222,128,0.2)",
      borderTop: "3px solid var(--verde)",
      animation: "spin 0.8s linear infinite",
      margin: "0 auto",
    }} />
  );
}

// ── STEPPER ───────────────────────────────────────────────────────────────────
export function Stepper({ paso }) {
  const steps = ["Foto", "Datos", "Resultado"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontFamily: "var(--mono)", fontWeight: 700,
              border: paso > i + 1 ? "2px solid var(--verde)" : paso === i + 1 ? "2px solid var(--verde)" : "2px solid #334155",
              color: paso > i + 1 ? "var(--verde)" : paso === i + 1 ? "#080d08" : "var(--sub)",
              background: paso === i + 1 ? "var(--verde)" : paso > i + 1 ? "rgba(74,222,128,0.1)" : "#0f172a",
            }}>
              {paso > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)" }}>{s}</span>
          </div>
          {i < 2 && (
            <div style={{
              width: 40, height: 2, marginBottom: 14,
              background: paso > i + 1 ? "var(--verde)" : "#1e293b",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── BARRA PROYECCIÓN ──────────────────────────────────────────────────────────
export function ProyBar({ label, kg, maxKg, color }) {
  const pct = Math.round((kg / maxKg) * 100);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <span style={{ fontSize: 13, color: "var(--sub)", fontFamily: "var(--mono)" }}>{label}</span>
      <div style={{ height: 10, background: "#1e293b", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 5, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontFamily: "var(--mono)", textAlign: "right" }}>{kg} kg</span>
    </div>
  );
}
