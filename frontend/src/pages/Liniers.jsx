import { useState, useEffect } from "react";
import { Landmark, RefreshCw, LineChart as LineChartIcon, Table2, AlertTriangle } from "lucide-react";
import { Card, SectionTitle, Spinner, PageHeader, BtnSecondary, Aviso } from "../components/UI.jsx";
import { formatPesos } from "../utils/helpers.js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "";

const CATEGORIAS = [
  { id: "novillo",    label: "Novillo" },
  { id: "novillito",  label: "Novillito" },
  { id: "ternero",    label: "Ternero" },
  { id: "ternera",    label: "Ternera" },
  { id: "vaquillona", label: "Vaquillona" },
  { id: "vaca",       label: "Vaca" },
  { id: "toro",       label: "Toro" },
];
const COLOR = "#16a34a";

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

  // Categorías que vienen del remate real; el resto se estiman a partir del novillo
  const esReal = (id) => !!hoy?.preciosRaw?.[id];

  return (
    <div className="page">
      <PageHeader
        icon={Landmark}
        titulo="Mercado de Liniers"
        sub={hoy ? `Remate del ${hoy.fecha}` : "Cargando precios..."}
        accion={<BtnSecondary icon={RefreshCw} tam="sm" onClick={cargar} disabled={loading}>Actualizar</BtnSecondary>}
      />

      {loading && !hoy && <Card style={{ textAlign: "center", padding: 48 }}><Spinner /><p style={{ marginTop: 16, color: "var(--sub)" }}>Consultando precios...</p></Card>}
      {error && <Aviso tipo="error" icon={AlertTriangle} style={{ marginBottom: 14 }}>{error}</Aviso>}

      {hoy && (
        <>
          {!hoy.preciosRaw || Object.keys(hoy.preciosRaw).length === 0 ? (
            <Aviso tipo="warn" icon={AlertTriangle} style={{ marginBottom: 14 }}>
              No se pudo leer el remate de hoy. Se muestran precios de referencia.
            </Aviso>
          ) : null}

          {/* Precios del día — grid de tarjetas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
            {CATEGORIAS.map(c => {
              const precio = hoy.precios?.[c.id];
              const activa = catActiva === c.id;
              return (
                <button key={c.id} onClick={() => setCatActiva(c.id)} aria-pressed={activa} style={{
                  padding: "14px 14px", borderRadius: "var(--radius)", textAlign: "left",
                  border: activa ? `1.5px solid ${COLOR}` : "1px solid var(--borde)",
                  background: activa ? "var(--verde-light)" : "#fff",
                  boxShadow: activa ? "0 0 0 3px var(--verde-dim)" : "var(--shadow)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--texto2)", fontWeight: 600 }}>{c.label}</span>
                    {!esReal(c.id) && <span title="Estimado a partir del novillo" style={{ fontSize: 10, fontWeight: 700, color: "var(--sub)", background: "var(--bg2)", padding: "1px 6px", borderRadius: 999 }}>EST.</span>}
                  </div>
                  <div className="num" style={{ fontSize: 20, fontWeight: 800, color: precio ? "var(--texto)" : "var(--sub2)" }}>
                    {precio ? `$${precio.toLocaleString("es-AR")}` : "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--sub)" }}>por kg vivo</div>
                </button>
              );
            })}
          </div>

          {/* Detalle categoría seleccionada */}
          {precioHoy && (
            <Card>
              <div style={{ fontSize: 13, color: "var(--sub)", fontWeight: 600, marginBottom: 2 }}>{cat.label} · precio hoy</div>
              <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "var(--verde-osc)", marginBottom: 14 }}>
                ${precioHoy.toLocaleString("es-AR")}<span style={{ fontSize: 15, fontWeight: 500, color: "var(--sub)" }}> /kg</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[300, 400, 500].map(kg => (
                  <div key={kg} style={{ background: "var(--bg2)", borderRadius: 10, padding: "10px 8px", textAlign: "center", minWidth: 0 }}>
                    <div className="num" style={{ fontSize: 12, color: "var(--sub)", fontWeight: 600 }}>{kg} kg</div>
                    <div className="num" style={{ fontSize: "clamp(13px,3.6vw,15px)", fontWeight: 700, color: "var(--texto)", whiteSpace: "nowrap" }}>{formatPesos(precioHoy * kg)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Gráfico histórico */}
          <Card>
            <SectionTitle icon={LineChartIcon}>Evolución de {cat.label.toLowerCase()}</SectionTitle>
            {chartData.length > 1 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={60} domain={["auto", "auto"]} tickFormatter={v => `$${Math.round(v).toLocaleString("es-AR")}`} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}
                      formatter={(v, name) => [`$${(v || 0).toLocaleString("es-AR")}/kg`, CATEGORIAS.find(c => c.id === name)?.label || name]}
                    />
                    <Line dataKey={catActiva} stroke={COLOR} strokeWidth={2.5} dot={{ r: 3, fill: COLOR }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <p style={{ fontSize: 12, color: "var(--sub2)", marginTop: 8 }}>
                  Se guarda un registro por día cada vez que se consultan los precios.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 14, color: "var(--sub)", textAlign: "center", padding: "16px 0" }}>
                El gráfico aparece cuando haya precios de al menos dos días distintos.
              </p>
            )}
          </Card>

          {/* Tabla completa */}
          <Card>
            <SectionTitle icon={Table2}>Precios del día</SectionTitle>
            <div style={{ overflowX: "auto", margin: "0 -4px" }}>
              <table className="num" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--borde)" }}>
                    {["Categoría", "$/kg", "300 kg", "400 kg"].map((h, i) => (
                      <th key={h} className={i === 3 ? "ocultar-mobile" : undefined} style={{ padding: "8px 6px", textAlign: i === 0 ? "left" : "right", fontSize: 12, color: "var(--sub)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIAS.map(c => {
                    const precio = hoy.precios?.[c.id];
                    const activa = catActiva === c.id;
                    return (
                      <tr key={c.id} onClick={() => setCatActiva(c.id)} style={{ borderBottom: "1px solid var(--bg2)", cursor: "pointer", background: activa ? "var(--verde-light)" : "transparent" }}>
                        <td style={{ padding: "11px 6px", fontWeight: 600, color: "var(--texto)", whiteSpace: "nowrap" }}>
                          {c.label}{!esReal(c.id) && <span style={{ color: "var(--sub2)", fontWeight: 500 }}> *</span>}
                        </td>
                        <td style={{ padding: "11px 6px", fontWeight: 700, color: "var(--verde-osc)", textAlign: "right", whiteSpace: "nowrap" }}>
                          {precio ? `$${precio.toLocaleString("es-AR")}` : "—"}
                        </td>
                        <td style={{ padding: "11px 6px", color: "var(--texto2)", textAlign: "right", whiteSpace: "nowrap" }}>{precio ? formatPesos(precio * 300) : "—"}</td>
                        <td className="ocultar-mobile" style={{ padding: "11px 6px", color: "var(--texto2)", textAlign: "right", whiteSpace: "nowrap" }}>{precio ? formatPesos(precio * 400) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub2)", marginTop: 12, lineHeight: 1.5 }}>
              Promedio ponderado del remate (importe ÷ kilos) · Fuente: Mercado Agroganadero S.A.
              {CATEGORIAS.some(c => !esReal(c.id)) && <><br />* Sin remate de esa categoría: estimado a partir del novillo.</>}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
