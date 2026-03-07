import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPesos, formatFecha } from "../utils/helpers.js";
import { TIPOS_ANIMAL, TIPO_EMOJI } from "../utils/constants.js";
import { ResumenCard, BtnPrimary, BtnSecondary, Card, SectionTitle } from "../components/UI.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Stock({ stock, onEliminar, totales }) {
  const nav = useNavigate();
  const [expandido, setExpandido] = useState(null);

  if (!stock.length) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐄</div>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Tu stock está vacío</h2>
        <p style={{ color: "var(--sub)", fontFamily: "var(--mono)", fontSize: 13, marginBottom: 28 }}>
          Analizá un animal para comenzar a registrar tu hacienda
        </p>
        <BtnPrimary onClick={() => nav("/analizar")}>📷 Analizar mi primer animal</BtnPrimary>
      </div>
    );
  }

  // Datos para gráfico
  const chartData = stock.map((a) => ({
    name: a.nombre.length > 12 ? a.nombre.slice(0, 12) + "…" : a.nombre,
    hoy:  Math.round((a.proyecciones?.valorHoy || 0) / 1000),
    "3m": Math.round((a.proyecciones?.valor3m  || 0) / 1000),
    "6m": Math.round((a.proyecciones?.valor6m  || 0) / 1000),
  }));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: "clamp(20px,4vw,26px)", color: "#0f172a" }}>📊 Mi Hacienda</h2>
        <BtnPrimary onClick={() => nav("/analizar")}>+ Agregar Animal</BtnPrimary>
      </div>

      {/* Resumen capital */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 28 }}>
        <ResumenCard
          titulo={`Capital Hoy · ${stock.length} animales`}
          valor={formatPesos(totales.valorHoy)}
          sub={`${totales.pesoTotal} kg en pie`}
          color="#3b82f6"
        />
        <ResumenCard
          titulo="Proyectado 3 Meses"
          valor={formatPesos(totales.valor3m)}
          sub={`+${formatPesos(totales.valor3m - totales.valorHoy)} estimado`}
          color="#8b5cf6"
        />
        <ResumenCard
          titulo="Proyectado 6 Meses"
          valor={formatPesos(totales.valor6m)}
          sub={`+${formatPesos(totales.valor6m - totales.valorHoy)} estimado`}
          color="#4ade80"
        />
      </div>

      {/* Gráfico */}
      {stock.length > 1 && (
        <Card style={{ marginBottom: 24 }}>
          <SectionTitle>📊 Valor por Animal (miles de $)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "var(--mono)", fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "var(--mono)", fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid #1e3a1e", fontFamily: "var(--mono)", fontSize: 12 }}
                formatter={(v) => [`$${v}k`, ""]}
              />
              <Bar dataKey="hoy"  fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="3m"   fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="6m"   fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[["#3b82f6","Hoy"],["#8b5cf6","3 meses"],["#4ade80","6 meses"]].map(([c,l]) => (
              <span key={l} style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--sub)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de animales */}
      <div>
        {stock.map((a) => {
          const ia = a.ia || {};
          const proy = a.proyecciones || {};
          const isOpen = expandido === a.id;
          return (
            <Card key={a.id} style={{ cursor: "pointer", marginBottom: 12 }}>
              <div onClick={() => setExpandido(isOpen ? null : a.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "clamp(15px,3vw,17px)", fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>
                      {TIPO_EMOJI[a.animal?.tipo] || "🐄"} {a.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)" }}>
                      {a.animal?.ubicacion} · {ia.pesoEstimadoKg} kg · CC {ia.condicionCorporal}/9 · {formatFecha(a.guardadoEn)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "clamp(17px,3.5vw,20px)", fontWeight: 900, color: "#16a34a" }}>
                      {formatPesos(proy.valorHoy)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)" }}>valor hoy</div>
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
                      <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: item.color }}>{formatPesos(item.val)}</div>
                      <div style={{ fontSize: 10, color: "var(--sub2)", fontFamily: "var(--mono)" }}>{item.kg} kg</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalle expandido */}
              {isOpen && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--borde)" }}>
                  {a.fotoURL && (
                    <img src={a.fotoURL} alt="Animal" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
                  )}
                  <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.7, marginBottom: 8 }}>
                    <strong style={{ color: "var(--texto)" }}>Observaciones:</strong> {ia.observaciones}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.7, marginBottom: 16 }}>
                    <strong style={{ color: "var(--texto)" }}>Recomendaciones:</strong> {ia.recomendaciones}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 12 }}>
                    Clima: {a.clima?.climaInfo} · {a.clima?.lluvia}mm · {a.clima?.temp}°C · Factor: {Math.round((a.clima?.factorClima||1)*100)}%
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
