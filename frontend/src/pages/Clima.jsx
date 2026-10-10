import { useState, useEffect } from "react";
import { CloudSun, MapPin, Thermometer, Droplets, CalendarDays, Wind, RefreshCw, AlertTriangle, Table2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, SectionTitle, Spinner, PageHeader, EmptyState, BtnPrimary, BtnSecondary, Aviso, MetricaCard } from "../components/UI.jsx";
import { wxInfo, fmtDia, fmtDiaLargo } from "../utils/clima.js";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

export default function Clima({ campoPrincipal }) {
  const nav = useNavigate();
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
      if (!d.daily?.time?.length) throw new Error("No llegaron datos del pronóstico");
      setClima(d);
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  if (!campoPrincipal?.lat) {
    return (
      <div className="page page-narrow">
        <PageHeader icon={CloudSun} titulo="Clima" />
        <EmptyState
          icon={MapPin}
          titulo="Configurá tu campo primero"
          texto="Para ver el pronóstico necesitamos saber dónde está tu campo."
          accion={<BtnPrimary icon={MapPin} onClick={() => nav("/campo")}>Ir a Mi campo</BtnPrimary>}
        />
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
  // ~60 mm en 14 días se considera normal; se escala si el pronóstico trae menos días
  const lluviaNormal = daily ? 60 * daily.time.length / 14 : 60;
  const factorLluvia = lluviaTotal ? Math.min(1.3, Math.max(0.5, lluviaTotal / lluviaNormal)) : 1;
  const factorTemp   = tempMaxProm ? (tempMaxProm > 28 ? 0.85 : tempMaxProm < 8 ? 0.75 : 1.0) : 1;
  const factor = ((factorLluvia + factorTemp) / 2);
  const efecto = factor >= 1.05
    ? { tipo: "ok",   icon: TrendingUp,   titulo: "Favorable para el engorde", texto: "Las lluvias y temperaturas previstas acompañan una buena producción de pasto." }
    : factor >= 0.9
    ? { tipo: "info", icon: Minus,        titulo: "Clima normal", texto: "No se esperan efectos importantes sobre el engorde." }
    : { tipo: "warn", icon: TrendingDown, titulo: "Condiciones desfavorables", texto: "El calor o la falta de lluvia pueden reducir la ganancia de peso." };

  const dias = daily?.time.length || 0;

  return (
    <div className="page">
      <PageHeader
        icon={CloudSun}
        titulo={`Clima en ${campoPrincipal.nombre}`}
        sub={campoPrincipal.direccion?.split(",").slice(0, 2).join(",")}
        accion={clima && <BtnSecondary icon={RefreshCw} tam="sm" onClick={() => cargar(campoPrincipal.lat, campoPrincipal.lon)} disabled={loading}>Actualizar</BtnSecondary>}
      />

      {loading && !clima && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <Spinner />
          <p style={{ marginTop: 16, color: "var(--sub)" }}>Consultando el pronóstico...</p>
        </Card>
      )}

      {error && (
        <Aviso tipo="error" icon={AlertTriangle} style={{ marginBottom: 14 }}>
          No se pudo cargar el pronóstico ({error}).{" "}
          <button onClick={() => cargar(campoPrincipal.lat, campoPrincipal.lon)} style={{ background: "none", border: "none", padding: 0, color: "inherit", fontWeight: 700, textDecoration: "underline", fontSize: "inherit" }}>
            Reintentar
          </button>
        </Aviso>
      )}

      {clima && daily && (
        <>
          {clima.fuente === "wttr.in" && (
            <Aviso tipo="info" icon={AlertTriangle} style={{ marginBottom: 14 }}>
              El servicio principal no respondió: se muestra un pronóstico de {dias} días de una fuente alternativa.
            </Aviso>
          )}

          {/* Efecto en engorde */}
          <Aviso tipo={efecto.tipo} icon={efecto.icon} style={{ marginBottom: 14, padding: "16px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{efecto.titulo}</div>
            <div style={{ marginTop: 2 }}>{efecto.texto}</div>
            <div className="num" style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              Ritmo de engorde estimado: <strong>{Math.round(factor * 100)}%</strong> de lo normal
            </div>
          </Aviso>

          {/* Resumen */}
          <div className="grid-4" style={{ marginBottom: 14 }}>
            <MetricaCard icon={Thermometer} titulo="Máx. promedio" valor={`${tempMaxProm}°C`} />
            <MetricaCard icon={Thermometer} titulo="Mín. promedio" valor={`${tempMinProm}°C`} />
            <MetricaCard icon={Droplets} titulo={`Lluvia ${dias} días`} valor={`${lluviaTotal} mm`} color="#0369a1" />
            <MetricaCard icon={CalendarDays} titulo="Días con lluvia" valor={diasLluvia} />
          </div>

          {/* Pronóstico día a día */}
          <Card>
            <SectionTitle icon={CalendarDays}>Pronóstico día por día</SectionTitle>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, margin: "0 -4px", padding: "0 4px 6px" }}>
              {daily.time.map((fecha, i) => {
                const lluvia = daily.precipitation_sum[i];
                const viento = daily.windspeed_10m_max?.[i];
                const hoyDia = i === 0;
                const wx = wxInfo(daily.weathercode[i]);
                const Icono = wx.icon;
                return (
                  <div key={fecha} title={wx.txt} style={{
                    minWidth: 76, padding: "12px 6px", borderRadius: 12, textAlign: "center", flexShrink: 0,
                    border: hoyDia ? "1.5px solid var(--verde)" : "1px solid var(--borde)",
                    background: hoyDia ? "var(--verde-light)" : "#fff",
                  }}>
                    <div style={{ fontSize: 12, color: hoyDia ? "var(--verde-txt)" : "var(--sub)", fontWeight: hoyDia ? 700 : 500, marginBottom: 8, textTransform: "capitalize" }}>
                      {hoyDia ? "Hoy" : fmtDia(fecha)}
                    </div>
                    <Icono size={26} color={wx.color} style={{ marginBottom: 6 }} />
                    <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{Math.round(daily.temperature_2m_max[i])}°</div>
                    <div className="num" style={{ fontSize: 13, color: "var(--sub)" }}>{Math.round(daily.temperature_2m_min[i])}°</div>
                    <div className="num" style={{ fontSize: 12, color: lluvia > 0.5 ? "#0369a1" : "var(--sub2)", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <Droplets size={11} />{lluvia > 0.5 ? `${Math.round(lluvia)}` : "0"}
                    </div>
                    {viento > 30 && (
                      <div className="num" style={{ fontSize: 11, color: "var(--sub)", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                        <Wind size={11} />{Math.round(viento)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "var(--sub2)", marginTop: 8 }}>
              Lluvia en mm · viento en km/h (si supera 30) · Fuente: {clima.fuente === "wttr.in" ? "wttr.in" : "Open-Meteo"}
            </p>
          </Card>

          {/* Tabla detallada */}
          <Card>
            <SectionTitle icon={Table2}>Detalle</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table className="num" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--borde)" }}>
                    {["Día", "Estado", "Máx", "Mín", "Lluvia", "Viento"].map((h, i) => (
                      <th key={h} className={i === 5 ? "ocultar-mobile" : undefined} style={{ padding: "8px 8px", textAlign: i < 2 ? "left" : "right", fontSize: 12, color: "var(--sub)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daily.time.map((fecha, i) => {
                    const wx = wxInfo(daily.weathercode[i]);
                    const Icono = wx.icon;
                    const celda = { padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" };
                    return (
                      <tr key={fecha} style={{ borderBottom: "1px solid var(--bg2)" }}>
                        <td style={{ ...celda, textAlign: "left", fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "var(--verde-txt)" : "var(--texto)", textTransform: "capitalize" }}>
                          {i === 0 ? "Hoy" : fmtDiaLargo(fecha)}
                        </td>
                        <td style={{ ...celda, textAlign: "left", color: "var(--sub)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icono size={16} color={wx.color} /> <span className="ocultar-mobile">{wx.txt}</span></span>
                        </td>
                        <td style={{ ...celda, fontWeight: 600 }}>{Math.round(daily.temperature_2m_max[i])}°</td>
                        <td style={{ ...celda, color: "var(--sub)" }}>{Math.round(daily.temperature_2m_min[i])}°</td>
                        <td style={{ ...celda, color: daily.precipitation_sum[i] >= 0.5 ? "#0369a1" : "var(--sub2)", fontWeight: 600 }}>
                          {daily.precipitation_sum[i] >= 0.5 ? `${Math.round(daily.precipitation_sum[i])} mm` : "—"}
                        </td>
                        <td className="ocultar-mobile" style={{ ...celda, color: "var(--sub)" }}>
                          {daily.windspeed_10m_max?.[i] ? `${Math.round(daily.windspeed_10m_max[i])} km/h` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
