import { useNavigate } from "react-router-dom";

export default function Home({ stockCount, campoPrincipal }) {
  const nav = useNavigate();
  const tieneCampo = !!campoPrincipal;

  const acciones = [
    {
      emoji: "📷",
      label: "Analizar Animal",
      desc: "Sacá una foto y la IA estima el peso, valor y proyección de engorde",
      path: "/analizar",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      primary: true,
    },
    {
      emoji: "📋",
      label: `Ver Stock (${stockCount} animales)`,
      desc: "Tu hacienda completa con valor actual y proyectado",
      path: "/stock",
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      emoji: "🗂️",
      label: "Administrar Lotes y Animales",
      desc: "Organizá tus animales por lote dentro del campo",
      path: "/lotes",
      color: "#7c3aed",
      bg: "#faf5ff",
      border: "#e9d5ff",
    },
    {
      emoji: "🌦️",
      label: "Ver el Clima en tu Campo",
      desc: `Pronóstico 14 días con efecto real en el engorde${campoPrincipal ? ` · ${campoPrincipal.nombre}` : ""}`,
      path: "/clima",
      color: "#0891b2",
      bg: "#f0f9ff",
      border: "#bae6fd",
    },
    {
      emoji: "🏛️",
      label: "Precios Liniers",
      desc: "Cotizaciones del día por categoría y evolución histórica",
      path: "/liniers",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
    },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(24px,5vw,48px) 16px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-block", padding: "5px 18px", borderRadius: 20,
          border: "1.5px solid #bbf7d0", fontSize: 11,
          letterSpacing: "0.2em", color: "#15803d", background: "#f0fdf4",
          fontWeight: 700, marginBottom: 20,
        }}>
          TECNOLOGÍA GANADERA · IA
        </div>
        <h1 style={{ fontSize: "clamp(2rem,6vw,3.2rem)", lineHeight: 1.1, marginBottom: 12, color: "#0f172a", fontFamily: "Georgia, serif" }}>
          Tu campo,<br />
          <span style={{ color: "#16a34a" }}>inteligente.</span>
        </h1>
        {campoPrincipal && (
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
            🌾 {campoPrincipal.nombre} · {campoPrincipal.direccion?.split(",")[0]}
          </p>
        )}
      </div>

      {/* Sin campo: CTA grande */}
      {!tieneCampo ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={() => nav("/campo")} style={{
            padding: "20px 40px", borderRadius: 14, background: "#16a34a",
            color: "#fff", border: "none", fontSize: "clamp(17px,3vw,20px)", fontWeight: 800,
            boxShadow: "0 4px 20px rgba(22,163,74,0.4)", cursor: "pointer",
            width: "100%", maxWidth: 440, display: "block", margin: "0 auto 12px",
          }}>
            🌾 Configurá tu Campo para empezar
          </button>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            Necesitás configurar tu campo antes de analizar animales
          </p>
        </div>
      ) : (
        /* Con campo: grilla de acciones */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {acciones.map((a) => (
            <button key={a.path} onClick={() => nav(a.path)} style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "18px 22px", borderRadius: 14, cursor: "pointer",
              background: a.primary ? a.color : a.bg,
              border: a.primary ? "none" : `1.5px solid ${a.border}`,
              color: a.primary ? "#fff" : "#1e293b",
              textAlign: "left", width: "100%",
              boxShadow: a.primary ? "0 4px 16px rgba(22,163,74,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: 32, flexShrink: 0 }}>{a.emoji}</span>
              <div>
                <div style={{ fontSize: "clamp(15px,2.5vw,17px)", fontWeight: 700, marginBottom: 3 }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 12, opacity: a.primary ? 0.85 : undefined, color: a.primary ? "#fff" : "#64748b", lineHeight: 1.4 }}>
                  {a.desc}
                </div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 18, opacity: 0.5, flexShrink: 0 }}>›</span>
            </button>
          ))}

          {/* Editar campo */}
          <button onClick={() => nav("/campo")} style={{
            padding: "12px 22px", borderRadius: 10, border: "1px solid #e2e8f0",
            background: "#fff", color: "#94a3b8", fontSize: 12, cursor: "pointer",
            textAlign: "center", marginTop: 4,
          }}>
            ⚙️ Editar configuración del campo
          </button>
        </div>
      )}
    </div>
  );
}
