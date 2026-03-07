import { useState, useEffect } from "react";
import { Card, SectionTitle, Spinner } from "../components/UI.jsx";

const API = import.meta.env.VITE_API_URL || "";

const WX_ICONS = {
  0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️",
  45:"🌫️", 48:"🌫️",
  51:"🌦️", 53:"🌦️", 55:"🌧️",
  61:"🌧️", 63:"🌧️", 65:"🌧️",
  71:"🌨️", 73:"🌨️", 75:"❄️",
  80:"🌦️", 81:"🌧️", 82:"⛈️",
  95:"⛈️", 96:"⛈️", 99:"⛈️",
};
function wxIcon(code) { return WX_ICONS[code] || "🌡️"; }
function fmtFecha(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

export default function Clima({ campoPrincipal }) {
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (campoPrincipal?.lat && campoPrincipal?.lon) {
      cargar(campoPrincipal.lat, campoPrincipal.lon);
    }
  }, [campoPrincipal?.lat, campoPrincipal?.lon]);

  async function cargar(lat, lon) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/clima?lat=${lat}&lon=${lon}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setClima(d);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  if (!campoPrincipal?.lat) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🌾</div>
        <h2 style={{ fontSize: 22, color: "#1e293b", marginBottom: 10 }}>Configurá tu campo primero</h2>
        <p style={{ color: "#64748b", fontSize: 15 }}>
          Para ver el clima de tu campo necesitás configurar la ubicación en "Mi Campo".
        </p>
      </div>
    );
  }

  const daily = clima?.daily;

  // Calcular resumen
  const lluviaTotal = daily ? daily.precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1) : null;
  const tempMaxProm = daily ? (daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length).toFixed(1) : null;
  const tempMinProm = daily ? (daily.temperature_2m_min.reduce((a, b) => a + b, 0) / daily.temperature_2m_min.length).toFixed(1) : null;
  const diasLluvia  = daily ? daily.precipitation_sum.filter(p => p > 1).length : null;

  // Efecto en engorde
  const factorLluvia = lluviaTotal ? Math.min(1.3, Math.max(0.5, lluviaTotal / 60)) : 1;
  const factorTemp   = tempMaxProm ? (tempMaxProm > 28 ? 0.85 : tempMaxProm < 8 ? 0.75 : 1.0) : 1;
  const factor = ((factorLluvia + factorTemp) / 2);
  const efectoColor = factor >= 1.05 ? "#16a34a" : factor >= 0.9 ? "#0891b2" : "#d97706";
  const efectoBg    = factor >= 1.05 ? "#f0fdf4" : factor >= 0.9 ? "#f0f9ff" : "#fffbeb";
  const efectoBorde = factor >= 1.05 ? "#bbf7d0" : factor >= 0.9 ? "#bae6fd" : "#fde68a";
  const efectoTexto = factor >= 1.05
    ? "✅ El clima de los próximos 14 días es favorable para el engorde. Las lluvias y temperaturas son ideales para mantener buena producción de pastura."
    : factor >= 0.9
    ? "➡️ El clima es normal. No se esperan efectos significativos sobre el engorde. Condiciones estables."
    : "⚠️ Condiciones desfavorables. El calor excesivo o la falta de lluvias puede reducir la ganancia de peso de tus animales.";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px" }}>

      {/* Header campo */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
          🌦️ Clima — {campoPrincipal.nombre}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          📍 {campoPrincipal.direccion} · {campoPrincipal.lat?.toFixed(4)}, {campoPrincipal.lon?.toFixed(4)}
        </p>
      </div>

      {loading && (
        <Card style={{ textAlign: "center", padding: "48px" }}>
          <Spinner />
          <p style={{ marginTop: 16, color: "#64748b" }}>Consultando Open-Meteo...</p>
        </Card>
      )}

      {error && (
        <Card>
          <p style={{ color: "#dc2626" }}>❌ {error}</p>
          <button onClick={() => cargar(campoPrincipal.lat, campoPrincipal.lon)}
            style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}>
            Reintentar
          </button>
        </Card>
      )}

      {clima && daily && (
        <>
          {/* Resumen 14 días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "🌡️", label: "Temp. Máx Prom", valor: `${tempMaxProm}°C`, color: "#dc2626" },
              { icon: "🌡️", label: "Temp. Mín Prom", valor: `${tempMinProm}°C`, color: "#2563eb" },
              { icon: "🌧️", label: "Lluvia Total",   valor: `${lluviaTotal}mm`, color: "#0891b2" },
              { icon: "🗓️", label: "Días con lluvia", valor: `${diasLluvia} días`, color: "#7c3aed" },
            ].map(m => (
              <div key={m.label} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "16px 12px", textAlign: "center",
                borderTop: `3px solid ${m.color}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.valor}</div>
              </div>
            ))}
          </div>

          {/* Efecto en engorde */}
          <div style={{
            background: efectoBg, border: `1.5px solid ${efectoBorde}`, borderRadius: 12,
            padding: "18px 20px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: efectoColor, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Impacto en el engorde
            </div>
            <p style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.6 }}>{efectoTexto}</p>
            <div style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              Factor climático: <strong style={{ color: efectoColor }}>{Math.round(factor * 100)}%</strong> del ritmo de engorde normal
            </div>
          </div>

          {/* Pronóstico día a día */}
          <Card>
            <SectionTitle>📅 PRONÓSTICO 14 DÍAS</SectionTitle>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {daily.time.map((fecha, i) => {
                const lluvia = daily.precipitation_sum[i];
                const tMax = Math.round(daily.temperature_2m_max[i]);
                const tMin = Math.round(daily.temperature_2m_min[i]);
                const viento = daily.windspeed_10m_max?.[i];
                const hoy = i === 0;
                return (
                  <div key={fecha} style={{
                    minWidth: 84, padding: "14px 8px", borderRadius: 12, textAlign: "center",
                    border: hoy ? "2px solid #16a34a" : "1px solid #e2e8f0",
                    background: hoy ? "#f0fdf4" : "#f8fafc",
                    flexShrink: 0, transition: "transform 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ fontSize: 10, color: hoy ? "#16a34a" : "#64748b", fontWeight: hoy ? 700 : 500, marginBottom: 6 }}>
                      {hoy ? "HOY" : fmtFecha(fecha)}
                    </div>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{wxIcon(daily.weathercode[i])}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>{tMax}°</div>
                    <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 4 }}>{tMin}°</div>
                    {lluvia > 0.5 && (
                      <div style={{ fontSize: 11, color: "#0891b2", fontWeight: 600 }}>
                        💧{Math.round(lluvia)}mm
                      </div>
                    )}
                    {viento > 30 && (
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        💨{Math.round(viento)}km/h
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
              Fuente: Open-Meteo · Actualizado ahora ·{" "}
              <button onClick={() => cargar(campoPrincipal.lat, campoPrincipal.lon)}
                style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}>
                Actualizar
              </button>
            </p>
          </Card>

          {/* Tabla detallada */}
          <Card style={{ marginTop: 0 }}>
            <SectionTitle>📊 TABLA DETALLADA</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    {["Día", "Estado", "T. Máx", "T. Mín", "Lluvia", "Viento"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daily.time.map((fecha, i) => (
                    <tr key={fecha} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#16a34a" : "#374151" }}>
                        {i === 0 ? "Hoy" : fmtFecha(fecha)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{wxIcon(daily.weathercode[i])}</td>
                      <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 600 }}>{Math.round(daily.temperature_2m_max[i])}°C</td>
                      <td style={{ padding: "10px 12px", color: "#2563eb", fontWeight: 600 }}>{Math.round(daily.temperature_2m_min[i])}°C</td>
                      <td style={{ padding: "10px 12px", color: daily.precipitation_sum[i] > 0 ? "#0891b2" : "#94a3b8", fontWeight: 600 }}>
                        {daily.precipitation_sum[i] > 0 ? `${Math.round(daily.precipitation_sum[i])}mm` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {daily.windspeed_10m_max?.[i] ? `${Math.round(daily.windspeed_10m_max[i])} km/h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
