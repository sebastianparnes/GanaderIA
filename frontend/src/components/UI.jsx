import React from "react";
import { Sprout, Check, AlertTriangle } from "lucide-react";

// ── LOGO ──────────────────────────────────────────────────────────────────────
export function Logo({ size = 34, conTexto = true, sub = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.28, background: "var(--verde)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 1px 3px rgba(22,163,74,0.35)",
      }}>
        <Sprout size={size * 0.58} color="#fff" strokeWidth={2.2} />
      </div>
      {conTexto && (
        <div>
          <div style={{ fontSize: size * 0.5, fontWeight: 800, color: "var(--texto)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Ganader<span style={{ color: "var(--verde)" }}>IA</span>
          </div>
          {sub && (
            <div style={{ fontSize: 10, color: "var(--sub2)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginTop: 3 }}>
              Gestión ganadera
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── NOTIFICACIÓN ─────────────────────────────────────────────────────────────
export function Notif({ notif }) {
  if (!notif) return null;
  const error = notif.tipo === "error";
  const Icono = error ? AlertTriangle : Check;
  return (
    <div role="status" style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      width: "max-content", maxWidth: "calc(100vw - 32px)",
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 12, zIndex: 9999,
      background: error ? "#b91c1c" : "#14532d",
      color: "#fff", fontSize: 14, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(15,23,42,0.25)",
      animation: "fadeIn 0.25s ease",
    }}>
      <Icono size={18} style={{ flexShrink: 0 }} />
      <span>{notif.msg}</span>
    </div>
  );
}

// ── ENCABEZADO DE PÁGINA ─────────────────────────────────────────────────────
export function PageHeader({ icon: Icono, titulo, sub, accion }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {Icono && <IconTile icon={Icono} />}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "clamp(20px,4vw,24px)", fontWeight: 800, color: "var(--texto)" }}>{titulo}</h1>
          {sub && <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}

// ── ÍCONO EN RECUADRO ────────────────────────────────────────────────────────
export function IconTile({ icon: Icono, color = "var(--verde)", bg = "var(--verde-light)", size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icono size={size * 0.5} strokeWidth={2} />
    </div>
  );
}

// ── ESTADO VACÍO ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, titulo, texto, accion }) {
  return (
    <Card style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <IconTile icon={icon} size={52} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{titulo}</h2>
      {texto && <p style={{ color: "var(--sub)", fontSize: 14, maxWidth: 380, margin: "0 auto" }}>{texto}</p>}
      {accion && <div style={{ marginTop: 20 }}>{accion}</div>}
    </Card>
  );
}

// ── AVISO ─────────────────────────────────────────────────────────────────────
const AVISO_COLORES = {
  info:  { bg: "#f0f9ff", border: "#bae6fd", color: "#075985" },
  ok:    { bg: "var(--verde-light)", border: "var(--verde-border)", color: "var(--verde-txt)" },
  warn:  { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
  error: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" },
  violeta: { bg: "#faf5ff", border: "#e9d5ff", color: "#6b21a8" },
};
export function Aviso({ tipo = "info", icon: Icono, children, style = {} }) {
  const c = AVISO_COLORES[tipo];
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "12px 14px", borderRadius: "var(--radius-sm)",
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontSize: 14, lineHeight: 1.5, ...style,
    }}>
      {Icono && <Icono size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, ...props }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--borde)",
      borderRadius: "var(--radius)",
      padding: "20px",
      marginBottom: 14,
      boxShadow: "var(--shadow)",
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

// ── CHIP SELECTOR ─────────────────────────────────────────────────────────────
export function ChipGrid({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {options.map((opt) => {
        const activo = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 999, fontSize: 14,
              fontWeight: activo ? 600 : 500,
              border: activo ? "1px solid var(--verde)" : "1px solid var(--borde-fuerte)",
              background: activo ? "var(--verde-light)" : "#fff",
              color: activo ? "var(--verde-txt)" : "var(--texto2)",
            }}
          >
            {activo && <Check size={14} strokeWidth={3} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── LABEL ─────────────────────────────────────────────────────────────────────
export function Label({ children }) {
  return (
    <span style={{ display: "block", fontSize: 13, color: "var(--texto2)", fontWeight: 600, marginBottom: 8 }}>
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
        marginBottom: 18, display: "block",
        ...style,
      }}
      {...props}
    />
  );
}

// ── BOTONES ───────────────────────────────────────────────────────────────────
function Btn({ variante, icon: Icono, children, className = "", tam, ...props }) {
  const clases = ["btn", `btn-${variante}`, tam && `btn-${tam}`, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={clases} {...props}>
      {Icono && <Icono size={tam === "sm" ? 15 : 18} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function BtnPrimary(props)   { return <Btn variante="primary" {...props} />; }
export function BtnSecondary(props) { return <Btn variante="secondary" {...props} />; }
export function BtnSoft(props)      { return <Btn variante="soft" {...props} />; }
export function BtnDanger(props)    { return <Btn variante="danger" {...props} />; }
export function BtnGhost(props)     { return <Btn variante="ghost" {...props} />; }

// ── SECTION TITLE ─────────────────────────────────────────────────────────────
export function SectionTitle({ icon: Icono, children, accion }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "var(--texto)" }}>
        {Icono && <Icono size={18} color="var(--verde)" strokeWidth={2.2} />}
        {children}
      </div>
      {accion}
    </div>
  );
}

// ── MÉTRICA ───────────────────────────────────────────────────────────────────
export function MetricaCard({ titulo, valor, sub, color = "var(--texto)", icon: Icono }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--borde)",
      borderRadius: "var(--radius)", padding: "14px 16px",
      boxShadow: "var(--shadow)", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sub)", fontWeight: 600, marginBottom: 6 }}>
        {Icono && <Icono size={14} />}
        {titulo}
      </div>
      <div className="num" style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2, overflowWrap: "anywhere" }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 4 }}>{sub}</div>}
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
        <span className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--texto)" }}>{kg} kg</span>
      </div>
      <div style={{ height: 8, background: "var(--bg2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── STEPPER ───────────────────────────────────────────────────────────────────
export function Stepper({ paso }) {
  const pasos = [{ n: 1, label: "Foto" }, { n: 2, label: "Datos" }, { n: 3, label: "Resultado" }];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
      {pasos.map((p, i) => {
        const hecho = paso > p.n, actual = paso === p.n;
        return (
          <React.Fragment key={p.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                background: hecho || actual ? "var(--verde)" : "#e5e7eb",
                color: hecho || actual ? "#fff" : "var(--sub)",
                boxShadow: actual ? "0 0 0 4px var(--verde-dim)" : "none",
              }}>
                {hecho ? <Check size={15} strokeWidth={3} /> : p.n}
              </div>
              <span style={{ fontSize: 13, color: actual ? "var(--texto)" : "var(--sub)", fontWeight: actual ? 700 : 500 }}>
                {p.label}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div style={{ flex: 1, maxWidth: 60, minWidth: 16, height: 2, background: hecho ? "var(--verde)" : "#e5e7eb", margin: "0 10px" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 40 }) {
  return (
    <div className="spin" style={{
      width: size, height: size, borderRadius: "50%", margin: "0 auto",
      border: `${Math.max(3, size / 11)}px solid #e5e7eb`,
      borderTopColor: "var(--verde)",
    }} />
  );
}

// ── RESUMEN CARD (alias de MetricaCard para Stock) ────────────────────────────
export function ResumenCard(props) {
  return <MetricaCard {...props} />;
}
