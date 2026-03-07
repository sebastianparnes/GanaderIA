import { useNavigate } from "react-router-dom";

export default function Home({ stockCount }) {
  const nav = useNavigate();
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
      <div style={{
        display: "inline-block", padding: "4px 16px", borderRadius: 20,
        border: "1px solid rgba(74,222,128,0.35)", fontSize: 10,
        letterSpacing: "0.2em", color: "var(--verde)", fontFamily: "var(--mono)", marginBottom: 24,
      }}>
        TECNOLOGÍA GANADERA · IA
      </div>

      <h1 style={{ fontSize: "clamp(2.6rem,8vw,4.2rem)", lineHeight: 1.05, marginBottom: 16, color: "#f0fdf0" }}>
        Tu campo,<br />
        <em style={{ color: "var(--verde)", fontStyle: "normal" }}>inteligente.</em>
      </h1>
      <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px", fontFamily: "var(--mono)" }}>
        Fotografiá tus animales · Estimación de peso con IA · Proyectá el engorde con datos climáticos reales · Conocé el valor de tu hacienda hoy y a futuro.
      </p>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
        <button
          onClick={() => nav("/analizar")}
          style={{
            padding: "14px 30px", borderRadius: 8, background: "var(--verde)",
            color: "#080d08", border: "none", fontSize: 15, fontWeight: 700,
            fontFamily: "var(--mono)", letterSpacing: "0.05em",
          }}
        >
          📷 Analizar Animal
        </button>
        <button
          onClick={() => nav("/stock")}
          style={{
            padding: "13px 28px", borderRadius: 8, background: "transparent",
            color: "var(--sub)", border: "1px solid rgba(148,163,184,0.25)",
            fontSize: 14, fontFamily: "var(--mono)",
          }}
        >
          📊 Ver Stock ({stockCount})
        </button>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
        {[
          { icon: "🤖", title: "IA Vision", desc: "Claude analiza la foto y estima el peso con precisión veterinaria" },
          { icon: "🌦️", title: "Clima Real", desc: "Open-Meteo: precipitaciones y temperatura de tu campo" },
          { icon: "📈", title: "Proyecciones", desc: "Engorde estimado a 3 y 6 meses ajustado por pastura y clima" },
          { icon: "💰", title: "Liniers", desc: "Valor de mercado de la hacienda hoy y proyectado" },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              padding: "20px 16px", borderRadius: 14, textAlign: "left",
              border: "1px solid var(--borde)", background: "rgba(74,222,128,0.02)",
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>{f.icon}</span>
            <strong style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--texto)" }}>{f.title}</strong>
            <span style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.5 }}>{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
