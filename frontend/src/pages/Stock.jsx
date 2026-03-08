import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatPesos, formatFecha } from "../utils/helpers.js";
import { TIPO_EMOJI } from "../utils/constants.js";
import { ResumenCard, BtnPrimary, BtnSecondary, Card, SectionTitle } from "../components/UI.jsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "";

export default function Stock({ stock, onEliminar, onActualizar, totales, campoPrincipal, user }) {
  const nav = useNavigate();
  const [expandido, setExpandido] = useState(null);
  const [analizando, setAnalizando] = useState(null); // id del animal que se está reanalyzando
  const [errorAnalisis, setErrorAnalisis] = useState(null);

  if (!stock.length) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐄</div>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Tu stock está vacío</h2>
        <p style={{ color: "var(--sub)", fontSize: 13, marginBottom: 28 }}>
          Analizá un animal para comenzar a registrar tu hacienda
        </p>
        <BtnPrimary onClick={() => nav("/analizar")}>📷 Analizar mi primer animal</BtnPrimary>
      </div>
    );
  }

  async function reanalizar(animal, fotoFile) {
    setAnalizando(animal.id); setErrorAnalisis(null);
    try {
      const formData = new FormData();
      formData.append("tipoAnimal",  animal.animal?.tipo     || "novillo");
      formData.append("edadMeses",   animal.animal?.edadMeses || 24);
      formData.append("pastura",     animal.animal?.pastura   || campoPrincipal?.pastura || "campo_natural");
      formData.append("ubicacion",   animal.animal?.ubicacion || campoPrincipal?.direccion || "Argentina");
      if (campoPrincipal?.lat) formData.append("lat", campoPrincipal.lat);
      if (campoPrincipal?.lon) formData.append("lon", campoPrincipal.lon);
      if (fotoFile) formData.append("foto", fotoFile);

      const r = await fetch(`${API}/api/analizar`, { method: "POST", body: formData });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Error en análisis");

      await onActualizar(animal.id, {
        ia: d.ia, proyecciones: d.proyecciones,
        clima: d.clima, satelital: d.satelital,
      });
    } catch(e) {
      setErrorAnalisis(e.message);
    } finally { setAnalizando(null); }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: "clamp(20px,4vw,26px)", color: "#0f172a", fontWeight: 800 }}>📊 Mi Hacienda</h2>
        <BtnPrimary onClick={() => nav("/analizar")}>+ Agregar Animal</BtnPrimary>
      </div>

      {/* Resumen capital */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
        <ResumenCard titulo={`Capital Hoy · ${stock.length} animales`} valor={formatPesos(totales.valorHoy)} sub={`${totales.pesoTotal} kg en pie`} color="#3b82f6" />
        <ResumenCard titulo="Proyectado 3 Meses" valor={formatPesos(totales.valor3m)} sub={`+${formatPesos(totales.valor3m - totales.valorHoy)} estimado`} color="#8b5cf6" />
        <ResumenCard titulo="Proyectado 6 Meses" valor={formatPesos(totales.valor6m)} sub={`+${formatPesos(totales.valor6m - totales.valorHoy)} estimado`} color="#4ade80" />
      </div>

      {errorAnalisis && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
          ❌ {errorAnalisis}
        </div>
      )}

      {/* Lista de animales */}
      <div>
        {stock.map((a) => {
          const ia = a.ia || {};
          const proy = a.proyecciones || {};
          const historial = a.historial || [];
          const isOpen = expandido === a.id;
          const estaCargando = analizando === a.id;

          return (
            <Card key={a.id} style={{ marginBottom: 12 }}>
              {/* Header — siempre visible */}
              <div onClick={() => setExpandido(isOpen ? null : a.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "clamp(15px,3vw,17px)", fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>
                      {TIPO_EMOJI[a.animal?.tipo] || "🐄"} {a.nombre}
                      {historial.length > 1 && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: "#dbeafe", color: "#2563eb", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                          {historial.length} análisis
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>
                      {a.animal?.ubicacion} · {ia.pesoEstimadoKg} kg · CC {ia.condicionCorporal}/9 · {formatFecha(a.guardado_en)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "clamp(17px,3.5vw,20px)", fontWeight: 900, color: "#16a34a" }}>
                      {formatPesos(proy.valorHoy)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>valor hoy</div>
                  </div>
                </div>

                {/* Proyecciones inline */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginTop: 14 }}>
                  {[
                    { label: "Hoy",     val: proy.valorHoy, kg: ia.pesoEstimadoKg, color: "#3b82f6" },
                    { label: "3 meses", val: proy.valor3m,  kg: proy.peso3m,        color: "#8b5cf6" },
                    { label: "6 meses", val: proy.valor6m,  kg: proy.peso6m,        color: "#16a34a" },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--sub)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{formatPesos(item.val)}</div>
                      <div style={{ fontSize: 10, color: "var(--sub2)" }}>{item.kg} kg</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalle expandido */}
              {isOpen && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--borde)" }}>

                  {/* Observaciones del último análisis */}
                  <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.7, marginBottom: 8 }}>
                    <strong style={{ color: "var(--texto)" }}>Observaciones:</strong> {ia.observaciones}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.7, marginBottom: 20 }}>
                    <strong style={{ color: "var(--texto)" }}>Recomendaciones:</strong> {ia.recomendaciones}
                  </p>

                  {/* Historial de análisis */}
                  {historial.length > 0 && (
                    <HistorialAnimal historial={historial} proyeccionesIniciales={historial[0]?.proyecciones} />
                  )}

                  {/* Botón nueva foto / re-análisis */}
                  <BtnNuevaFoto animal={a} onReanalizar={reanalizar} cargando={estaCargando} />

                  {/* Eliminar */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <BtnSecondary
                      style={{ fontSize: 12, padding: "7px 16px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                      onClick={(e) => { e.stopPropagation(); onEliminar(a.id); }}
                    >
                      🗑 Eliminar
                    </BtnSecondary>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── HISTORIAL + GRÁFICO ───────────────────────────────────────────────────────
function HistorialAnimal({ historial, proyeccionesIniciales }) {
  if (historial.length === 0) return null;

  // Construir datos del gráfico
  // Línea real: cada punto del historial
  // Línea proyectada: desde el primer análisis, los pesos proyectados a 3 y 6 meses
  const primerFecha = new Date(historial[0].fecha);

  const chartData = historial.map((h, i) => {
    const diasDesdeInicio = Math.round((new Date(h.fecha) - primerFecha) / (1000 * 60 * 60 * 24));
    return {
      label: i === 0 ? "Inicio" : formatFechaCorta(h.fecha),
      dias: diasDesdeInicio,
      pesoReal: h.pesoEstimadoKg,
      CC: h.condicionCorporal,
    };
  });

  // Agregar puntos proyectados desde el primer análisis
  const ganDiaria = proyeccionesIniciales?.ganDiaria;
  const pesoInicial = historial[0].pesoEstimadoKg;
  if (ganDiaria && pesoInicial) {
    chartData.push(
      { label: "Proy. 3m", dias: 90,  pesoProyectado: Math.round(pesoInicial + ganDiaria * 90) },
      { label: "Proy. 6m", dias: 180, pesoProyectado: Math.round(pesoInicial + ganDiaria * 180) },
    );
  }

  // También la proyección desde el último análisis
  const ultimo = historial[historial.length - 1];
  const ganDiariaUltimo = ultimo?.proyecciones?.ganDiaria;
  const pesoUltimo = ultimo?.pesoEstimadoKg;
  const diasUltimo = Math.round((new Date(ultimo.fecha) - primerFecha) / (1000 * 60 * 60 * 24));
  if (ganDiariaUltimo && pesoUltimo && historial.length > 1) {
    chartData.push(
      { label: "Proy. actual 3m", dias: diasUltimo + 90,  pesoProyActual: Math.round(pesoUltimo + ganDiariaUltimo * 90) },
      { label: "Proy. actual 6m", dias: diasUltimo + 180, pesoProyActual: Math.round(pesoUltimo + ganDiariaUltimo * 180) },
    );
  }

  chartData.sort((a, b) => a.dias - b.dias);

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionTitle>📈 TRAYECTORIA DEL ANIMAL</SectionTitle>

      {/* Gráfico solo si hay más de 1 punto real o hay proyecciones */}
      {chartData.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit=" kg" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [v ? `${v} kg` : "—", name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="pesoReal" name="Peso real" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5, fill: "#2563eb" }} connectNulls={false} />
              <Line dataKey="pesoProyectado" name="Proyectado (inicio)" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
              {historial.length > 1 && (
                <Line dataKey="pesoProyActual" name="Proyectado (actual)" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla del historial */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              {["Fecha", "Peso estimado", "CC", "Gan. diaria", "Observaciones"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historial.map((h, i) => {
              const pesoAnterior = i > 0 ? historial[i-1].pesoEstimadoKg : null;
              const gananciReal = pesoAnterior
                ? ((h.pesoEstimadoKg - pesoAnterior) / Math.max(1, Math.round((new Date(h.fecha) - new Date(historial[i-1].fecha)) / 86400000))).toFixed(2)
                : null;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#374151" }}>
                    {i === 0 ? <span style={{ background: "#dbeafe", color: "#2563eb", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Inicial</span> : formatFecha(h.fecha)}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1e293b" }}>
                    {h.pesoEstimadoKg} kg
                    {gananciReal && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: parseFloat(gananciReal) >= 0 ? "#16a34a" : "#dc2626" }}>
                        {parseFloat(gananciReal) >= 0 ? "▲" : "▼"} {Math.abs(gananciReal)} kg/día
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#374151" }}>{h.condicionCorporal}/9</td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12 }}>
                    {h.proyecciones?.ganDiaria ? `${h.proyecciones.ganDiaria} kg/día` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12, maxWidth: 220 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.observaciones}>
                      {h.observaciones || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BOTÓN NUEVA FOTO ──────────────────────────────────────────────────────────
function BtnNuevaFoto({ animal, onReanalizar, cargando }) {
  const inputRef  = useRef(null);
  const camaraRef = useRef(null);
  const [foto, setFoto]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [modo, setModo]       = useState(false); // mostrar panel

  function onFoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFoto(f);
    setPreview(URL.createObjectURL(f));
  }

  async function confirmar() {
    await onReanalizar(animal, foto);
    setModo(false); setFoto(null); setPreview(null);
  }

  if (!modo) {
    return (
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setModo(true)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 10,
          border: "2px solid #bbf7d0", background: "#f0fdf4",
          color: "#166534", cursor: "pointer", fontSize: 14, fontWeight: 600,
          width: "100%", justifyContent: "center",
        }}>
          📷 Nueva foto / Actualizar análisis
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12, background: "#f8fafc", borderRadius: 12, padding: 16, border: "1.5px solid #e2e8f0" }}>
      <p style={{ fontSize: 13, color: "#374151", marginBottom: 12, fontWeight: 600 }}>
        📷 Nuevo análisis para <strong>{animal.nombre}</strong>
      </p>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Podés subir una foto nueva o actualizar sin foto. El resultado se va a agregar al historial del animal.
      </p>

      {preview && (
        <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={onFoto} style={{ display: "none" }} />
      <input ref={camaraRef} type="file" accept="image/*" capture="environment" onChange={onFoto} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => camaraRef.current.click()} style={{
          padding: "9px 16px", borderRadius: 8, border: "1.5px solid #bbf7d0",
          background: "#f0fdf4", color: "#166534", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          📷 Sacar foto
        </button>
        <button onClick={() => inputRef.current.click()} style={{
          padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13,
        }}>
          🖼️ Elegir de galería
        </button>
        {foto && <span style={{ fontSize: 12, color: "#16a34a", alignSelf: "center" }}>✓ {foto.name}</span>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <BtnPrimary onClick={confirmar} style={{ flex: 1 }} disabled={cargando}>
          {cargando ? "⏳ Analizando..." : "🤖 Analizar ahora"}
        </BtnPrimary>
        <BtnSecondary onClick={() => { setModo(false); setFoto(null); setPreview(null); }}>
          Cancelar
        </BtnSecondary>
      </div>
    </div>
  );
}

function formatFechaCorta(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
