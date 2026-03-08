import { useNavigate } from "react-router-dom";

export default function Home({ stockCount, campoPrincipal }) {
  const nav = useNavigate();
  const tieneCampo = !!campoPrincipal;
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(24px,5vw,56px) 16px", textAlign: "center" }}>

      <div style={{
        display: "inline-block", padding: "5px 18px", borderRadius: 20,
        border: "1.5px solid #bbf7d0", fontSize: 11,
        letterSpacing: "0.2em", color: "#15803d", background: "#f0fdf4",
        fontWeight: 700, marginBottom: 28,
      }}>
        TECNOLOGÍA GANADERA · IA
      </div>

      <h1 style={{ fontSize: "clamp(2.4rem,7vw,4rem)", lineHeight: 1.1, marginBottom: 16, color: "#0f172a", fontFamily: "Georgia, serif" }}>
        Tu campo,<br />
        <span style={{ color: "#16a34a" }}>inteligente.</span>
      </h1>
      <p style={{ fontSize: "clamp(14px,2.5vw,16px)", color: "#475569", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
        Fotografiá tus animales · Estimación de peso con IA · Proyectá el engorde con datos climáticos reales · Conocé el valor de tu hacienda hoy y a futuro.
      </p>

      {/* CTA principal: configurar campo si no tiene, o analizar si ya tiene */}
      {!tieneCampo ? (
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => nav("/campo")}
            style={{
              padding: "18px 40px", borderRadius: 12, background: "#16a34a",
              color: "#fff", border: "none", fontSize: "clamp(16px,3vw,19px)", fontWeight: 800,
              boxShadow: "0 4px 16px rgba(22,163,74,0.4)", cursor: "pointer",
              width: "100%", maxWidth: 420, display: "block", margin: "0 auto 12px",
            }}
          >
            🌾 Configurá tu Campo para empezar
          </button>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>Necesitás configurar tu campo antes de analizar animales</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <button
            onClick={() => nav("/analizar")}
            style={{
              padding: "16px 32px", borderRadius: 10, background: "#16a34a",
              color: "#fff", border: "none", fontSize: "clamp(15px,2.5vw,17px)", fontWeight: 700,
              boxShadow: "0 2px 8px rgba(22,163,74,0.35)", cursor: "pointer",
              width: "clamp(200px,45vw,240px)",
            }}
          >
            📷 Analizar Animal
          </button>
          <button
            onClick={() => nav("/stock")}
            style={{
              padding: "15px 28px", borderRadius: 10, background: "#fff",
              color: "#374151", border: "1.5px solid #d1d5db",
              fontSize: "clamp(14px,2.5vw,16px)", cursor: "pointer",
              width: "clamp(160px,40vw,200px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            📊 Ver Stock ({stockCount})
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
        {[
          { icon: "🤖", title: "IA Vision", desc: "Gemini analiza la foto y estima el peso con precisión veterinaria", color: "#eff6ff", border: "#bfdbfe" },
          { icon: "🌦️", title: "Clima Real", desc: "Pronóstico 16 días: lluvias y temperatura que afectan el engorde", color: "#f0fdf4", border: "#bbf7d0" },
          { icon: "📈", title: "Proyecciones", desc: "Engorde estimado a 3 y 6 meses según pastura y clima", color: "#faf5ff", border: "#e9d5ff" },
          { icon: "💰", title: "Liniers", desc: "Precios reales del día y valor proyectado de tu hacienda", color: "#fffbeb", border: "#fde68a" },
        ].map((f) => (
          <div key={f.title} style={{
            padding: "20px 16px", borderRadius: 12, textAlign: "left",
            border: `1.5px solid ${f.border}`, background: f.color,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>{f.icon}</span>
            <strong style={{ fontSize: 14, color: "#1e293b" }}>{f.title}</strong>
            <span style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
