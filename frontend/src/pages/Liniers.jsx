import { useState, useEffect } from "react";
import { Card, SectionTitle, Spinner } from "../components/UI.jsx";
import { formatPesos } from "../utils/helpers.js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "";

const CATEGORIAS = [
  { id: "novillo",    label: "Novillo",    color: "#2563eb", emoji: "🐂" },
  { id: "novillito",  label: "Novillito",  color: "#7c3aed", emoji: "🐃" },
  { id: "ternero",    label: "Ternero",    color: "#16a34a", emoji: "🐄" },
  { id: "ternera",    label: "Ternera",    color: "#059669", emoji: "🐄" },
  { id: "vaquillona", label: "Vaquillona", color: "#d97706", emoji: "🐄" },
  { id: "vaca",       label: "Vaca",       color: "#dc2626", emoji: "🐄" },
  { id: "toro",       label: "Toro",       color: "#0891b2", emoji: "🐂" },
];

function parseFecha(str) {
  // "DD/MM/YYYY" → Date
  if (!str || str === "Sin datos reales") return null;
  const [d, m, y] = str.split("/");
  return new Date(`${y}-${m}-${d}`);
}

function fmtFechaCorta(str) {
  const d = parseFecha(str);
  if (!d) return str;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default function Liniers() {
  const [hoy, setHoy]         = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [catActiva, setCatActiva] = useState("novillo");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true); setError("");
    try {
      const [rHoy, rHist] = await Promise.all([
        fetch(`${API}/api/liniers`).then(r => r.json()),
        fetch(`${API}/api/liniers/historico`).then(r => r.json()),
      ]);
      setHoy(rHoy);
      setHistorico((rHist.historico || []).reverse()); // cronológico
    } catch(e) { setError("No se pudo conectar al servidor"); }
    finally { setLoading(false); }
  }

  // Preparar datos para gráfico
  const chartData = historico.map(h => {
    const row = { fecha: fmtFechaCorta(h.fecha) };
    CATEGORIAS.forEach(c => { row[c.id] = h.precios?.[c.id] || null; });
    return row;
  });

  const precioHoy = hoy?.precios?.[catActiva];
  const cat = CATEGORIAS.find(c => c.id === catActiva);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            🏛️ Mercado de Liniers
          </h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            {hoy ? `Precios al ${hoy.fecha} · ${hoy.fuente}` : "Cargando precios..."}
          </p>
        </div>
        <button onClick={cargar} style={{
          padding: "8px 16px", borderRadius: 8, background: "#f0fdf4",
          border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 13,
          fontWeight: 600, cursor: "pointer",
        }}>↻ Actualizar</button>
      </div>

      {loading && <Card style={{ textAlign: "center", padding: 48 }}><Spinner /><p style={{ marginTop: 16, color: "#64748b" }}>Consultando precios...</p></Card>}
      {error && <Card><p style={{ color: "#dc2626" }}>❌ {error}</p></Card>}

      {hoy && !loading && (
        <>
          {/* Precios del día — grid de tarjetas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 24 }}>
            {CATEGORIAS.map(c => {
              const precio = hoy.precios?.[c.id];
              const activa = catActiva === c.id;
              return (
                <button key={c.id} onClick={() => setCatActiva(c.id)} style={{
                  padding: "14px 10px", borderRadius: 12, textAlign: "center",
                  border: activa ? `2px solid ${c.color}` : "1.5px solid #e2e8f0",
                  background: activa ? `${c.color}12` : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: activa ? `0 2px 8px ${c.color}30` : "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{c.emoji}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: precio ? c.color : "#94a3b8" }}>
                    {precio ? `$${precio.toLocaleString("es-AR")}` : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>/kg vivo</div>
                </button>
              );
            })}
          </div>

          {/* Detalle categoría seleccionada */}
          {precioHoy && (
            <div style={{
              background: `${cat.color}08`, border: `1.5px solid ${cat.color}30`,
              borderRadius: 12, padding: "16px 20px", marginBottom: 24,
              display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  {cat.emoji} {cat.label} — Precio hoy
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: cat.color }}>
                  ${precioHoy.toLocaleString("es-AR")}<span style={{ fontSize: 16, fontWeight: 500, color: "#64748b" }}>/kg</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[300, 400, 500].map(kg => (
                  <div key={kg} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{kg} kg</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{formatPesos(precioHoy * kg)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico histórico */}
          {chartData.length > 1 ? (
            <Card>
              <SectionTitle>📈 EVOLUCIÓN HISTÓRICA DE PRECIOS</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {CATEGORIAS.map(c => (
                  <button key={c.id} onClick={() => setCatActiva(c.id)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    border: catActiva === c.id ? `1.5px solid ${c.color}` : "1.5px solid #e2e8f0",
                    background: catActiva === c.id ? `${c.color}15` : "#f8fafc",
                    color: catActiva === c.id ? c.color : "#64748b",
                    fontWeight: catActiva === c.id ? 700 : 400,
                  }}>{c.label}</button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                    formatter={(v, name) => [`$${(v||0).toLocaleString("es-AR")}/kg`, CATEGORIAS.find(c=>c.id===name)?.label || name]}
                  />
                  <Line dataKey={catActiva} stroke={cat.color} strokeWidth={2.5} dot={{ r: 4, fill: cat.color }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                Se registra automáticamente cada vez que se consultan precios · Fuente: Mercado Agroganadero S.A.
              </p>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <p style={{ fontSize: 14 }}>El gráfico histórico aparecerá a medida que se acumulen datos de días distintos.</p>
              </div>
            </Card>
          )}

          {/* Tabla completa */}
          <Card style={{ marginTop: 0 }}>
            <SectionTitle>📋 TABLA DE PRECIOS DEL DÍA</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    {["Categoría", "$/kg vivo", "500 kg", "400 kg", "300 kg"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIAS.map((c, i) => {
                    const precio = hoy.precios?.[c.id];
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}
                        onClick={() => setCatActiva(c.id)}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>
                          {c.emoji} {c.label}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: precio ? c.color : "#94a3b8", fontSize: 16 }}>
                          {precio ? `$${precio.toLocaleString("es-AR")}` : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#374151" }}>{precio ? formatPesos(precio * 500) : "—"}</td>
                        <td style={{ padding: "12px 14px", color: "#374151" }}>{precio ? formatPesos(precio * 400) : "—"}</td>
                        <td style={{ padding: "12px 14px", color: "#374151" }}>{precio ? formatPesos(precio * 300) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
              * Precios orientativos "muy buena clase" · Verificar en mercadoagroganadero.com.ar
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
