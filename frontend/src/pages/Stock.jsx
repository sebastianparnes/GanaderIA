import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatPesos, formatFecha } from "../utils/helpers.js";
import { TIPOS_ANIMAL } from "../utils/constants.js";
import {
  Plus, Camera, Images, Sparkles, Trash2, ChevronDown, TrendingUp, ClipboardList, AlertTriangle, X, History,
} from "lucide-react";
import { ResumenCard, BtnPrimary, BtnSecondary, BtnSoft, BtnDanger, Card, SectionTitle, PageHeader, EmptyState, Aviso } from "../components/UI.jsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "";

export default function Stock({ stock, onEliminar, onActualizar, totales, campoPrincipal, user }) {
  const nav = useNavigate();
  const [expandido, setExpandido] = useState(null);
  const [analizando, setAnalizando] = useState(null); // id del animal que se está reanalyzando
  const [errorAnalisis, setErrorAnalisis] = useState(null);

  if (!stock.length) {
    return (
      <div className="page page-narrow">
        <PageHeader icon={ClipboardList} titulo="Mi hacienda" />
        <EmptyState
          icon={Camera}
          titulo="Todavía no cargaste animales"
          texto="Analizá un animal con una foto para empezar a registrar tu hacienda y su valor."
          accion={<BtnPrimary icon={Camera} onClick={() => nav("/analizar")}>Analizar mi primer animal</BtnPrimary>}
        />
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
    <div className="page">
      <PageHeader
        icon={ClipboardList}
        titulo="Mi hacienda"
        sub={`${stock.length} ${stock.length === 1 ? "animal" : "animales"} · ${totales.pesoTotal.toLocaleString("es-AR")} kg en pie`}
        accion={<BtnPrimary icon={Plus} onClick={() => nav("/analizar")}>Agregar</BtnPrimary>}
      />

      {/* Resumen capital */}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <ResumenCard titulo="Capital hoy" valor={formatPesos(totales.valorHoy)} sub="Precio Liniers del día" />
        <ResumenCard titulo="En 3 meses" valor={formatPesos(totales.valor3m)} sub={`+${formatPesos(totales.valor3m - totales.valorHoy)}`} color="var(--verde-osc)" />
        <ResumenCard titulo="En 6 meses" valor={formatPesos(totales.valor6m)} sub={`+${formatPesos(totales.valor6m - totales.valorHoy)}`} color="var(--verde-osc)" />
      </div>

      {errorAnalisis && (
        <Aviso tipo="error" icon={AlertTriangle} style={{ marginBottom: 14 }}>{errorAnalisis}</Aviso>
      )}

      {/* Lista de animales */}
      <div>
        {stock.map((a) => {
          const ia = a.ia || {};
          const proy = a.proyecciones || {};
          const historial = a.historial || [];
          const isOpen = expandido === a.id;
          const estaCargando = analizando === a.id;
          const tipo = TIPOS_ANIMAL.find(t => t.id === a.animal?.tipo);

          return (
            <Card key={a.id} style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
              {/* Header — siempre visible */}
              <button onClick={() => setExpandido(isOpen ? null : a.id)} aria-expanded={isOpen} style={{
                display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "16px 18px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--texto)" }}>{a.nombre}</span>
                      {tipo && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--sub)", background: "var(--bg2)", padding: "1px 8px", borderRadius: 999 }}>
                          {tipo.label}
                        </span>
                      )}
                      {historial.length > 1 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#1d4ed8", background: "#eff6ff", padding: "1px 8px", borderRadius: 999 }}>
                          <History size={12} /> {historial.length}
                        </span>
                      )}
                    </div>
                    <div className="num" style={{ fontSize: 13, color: "var(--sub)", marginTop: 3 }}>
                      {ia.pesoEstimadoKg} kg · CC {ia.condicionCorporal}/9 · {formatFecha(a.guardado_en)}
                    </div>
                  </div>
                  <ChevronDown size={20} color="var(--sub2)" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>

                {/* Proyecciones inline */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                  {[
                    { label: "Hoy",     val: proy.valorHoy, kg: ia.pesoEstimadoKg },
                    { label: "3 meses", val: proy.valor3m,  kg: proy.peso3m },
                    { label: "6 meses", val: proy.valor6m,  kg: proy.peso6m },
                  ].map((item, i) => (
                    <div key={item.label} style={{ background: i === 0 ? "var(--bg2)" : "var(--verde-light)", borderRadius: 10, padding: "8px 6px", textAlign: "center", minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600 }}>{item.label}</div>
                      <div className="num" style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? "var(--texto)" : "var(--verde-osc)", overflowWrap: "anywhere" }}>{formatPesos(item.val)}</div>
                      <div className="num" style={{ fontSize: 11, color: "var(--sub)" }}>{item.kg} kg</div>
                    </div>
                  ))}
                </div>
              </button>

              {/* Detalle expandido */}
              {isOpen && (
                <div className="fade-in" style={{ padding: "16px 18px 18px", borderTop: "1px solid var(--borde)", background: "#fcfcfd" }}>
                  <p style={{ fontSize: 14, color: "var(--texto2)", lineHeight: 1.6, marginBottom: 8 }}>
                    <strong>Observaciones:</strong> {ia.observaciones}
                  </p>
                  <p style={{ fontSize: 14, color: "var(--texto2)", lineHeight: 1.6, marginBottom: 18 }}>
                    <strong>Recomendaciones:</strong> {ia.recomendaciones}
                  </p>

                  {historial.length > 0 && (
                    <HistorialAnimal historial={historial} proyeccionesIniciales={historial[0]?.proyecciones} />
                  )}

                  <BtnNuevaFoto animal={a} onReanalizar={reanalizar} cargando={estaCargando} />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <BtnDanger
                      icon={Trash2}
                      tam="sm"
                      onClick={() => { if (confirm(`¿Eliminar a ${a.nombre} de la hacienda?`)) onEliminar(a.id); }}
                    >
                      Eliminar
                    </BtnDanger>
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
      <SectionTitle icon={TrendingUp}>Trayectoria del animal</SectionTitle>

      {/* Gráfico solo si hay más de 1 punto real o hay proyecciones */}
      {chartData.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit=" kg" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => [v ? `${v} kg` : "—", name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="pesoReal" name="Peso real" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 5, fill: "#16a34a" }} connectNulls={false} />
              <Line dataKey="pesoProyectado" name="Proyectado (inicio)" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
              {historial.length > 1 && (
                <Line dataKey="pesoProyActual" name="Proyectado (actual)" stroke="#0e7490" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
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
                    {i === 0 ? <span style={{ background: "var(--verde-light)", color: "var(--verde-txt)", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Inicial</span> : formatFecha(h.fecha)}
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
      <BtnSoft icon={Camera} className="btn-block" onClick={() => setModo(true)} style={{ marginBottom: 4 }}>
        Nueva foto / actualizar análisis
      </BtnSoft>
    );
  }

  return (
    <div style={{ marginBottom: 4, background: "#fff", borderRadius: 12, padding: 16, border: "1px solid var(--borde)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Nuevo análisis</p>
        <button onClick={() => { setModo(false); setFoto(null); setPreview(null); }} className="btn btn-ghost btn-icon" aria-label="Cancelar">
          <X size={18} />
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 14 }}>
        Subí una foto nueva o actualizá sin foto. El resultado se suma al historial.
      </p>

      {preview && (
        <img src={preview} alt="Vista previa" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={onFoto} style={{ display: "none" }} />
      <input ref={camaraRef} type="file" accept="image/*" capture="environment" onChange={onFoto} style={{ display: "none" }} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <BtnSecondary icon={Camera} tam="sm" onClick={() => camaraRef.current.click()}>Sacar foto</BtnSecondary>
        <BtnSecondary icon={Images} tam="sm" onClick={() => inputRef.current.click()}>Galería</BtnSecondary>
      </div>

      <BtnPrimary icon={Sparkles} className="btn-block" onClick={confirmar} disabled={cargando}>
        {cargando ? "Analizando..." : "Analizar ahora"}
      </BtnPrimary>
    </div>
  );
}

function formatFechaCorta(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
