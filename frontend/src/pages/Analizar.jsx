import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analizarAnimal } from "../utils/api.js";
import { TIPOS_ANIMAL, TIPOS_PASTURA, CONFIANZA_COLOR, TIPO_EMOJI } from "../utils/constants.js";
import { formatPesos } from "../utils/helpers.js";
import {
  Card, ChipGrid, Label, Input, BtnPrimary, BtnSecondary,
  SectionTitle, MetricaCard, ProyBar, Stepper, Spinner,
} from "../components/UI.jsx";

export default function Analizar({ onGuardar, notif, campoPrincipal }) {
  const nav = useNavigate();
  const [paso, setPaso] = useState(1);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoURL, setFotoURL] = useState(null);
  const [tipoAnimal, setTipoAnimal] = useState("");
  const [edadMeses, setEdadMeses] = useState("");
  // Usar datos del campo si existen
  const [pastura, setPastura] = useState(campoPrincipal?.pastura || "");
  const [ubicacion, setUbicacion] = useState(campoPrincipal?.direccion || "");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [nombreAnimal, setNombreAnimal] = useState("");
  const fileRef   = useRef();
  const camaraRef = useRef();

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoURL(URL.createObjectURL(file));
    setPaso(2);
  }

  function sinFoto() { setFotoFile(null); setFotoURL(null); setPaso(2); }

  function reset() {
    setPaso(1); setFotoFile(null); setFotoURL(null);
    setTipoAnimal(""); setEdadMeses("");
    setPastura(campoPrincipal?.pastura || "");
    setUbicacion(campoPrincipal?.direccion || "");
    setResultado(null); setNombreAnimal("");
  }

  async function analizar() {
    if (!tipoAnimal || !edadMeses || !pastura || !ubicacion) {
      notif("Completá todos los campos", "error"); return;
    }
    setLoading(true);
    setPaso(3);
    try {
      // Si tenemos coordenadas del campo, pasarlas al backend
      const datos = {
        tipoAnimal, edadMeses, pastura, ubicacion,
        ...(campoPrincipal?.lat ? { lat: campoPrincipal.lat, lon: campoPrincipal.lon } : {}),
      };
      const data = await analizarAnimal(datos, fotoFile);
      setResultado({ ...data, fotoURL });
    } catch (err) {
      notif("Error: " + (err.response?.data?.error || err.message), "error");
      setPaso(2);
    } finally {
      setLoading(false);
    }
  }

  function guardar() {
    if (!resultado) return;
    const tipoInfo = TIPOS_ANIMAL.find((t) => t.id === tipoAnimal);
    const nombre = nombreAnimal.trim() || `${tipoInfo?.label || tipoAnimal} #${Date.now() % 1000}`;
    onGuardar({ nombre, fotoURL, campo: campoPrincipal?.nombre, ...resultado });
    notif(`${nombre} guardado en stock ✓`);
    nav("/stock");
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>

      {/* Banner campo configurado */}
      {campoPrincipal && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          padding: "10px 16px", borderRadius: 10,
          background: "#f0fdf4", border: "1px solid var(--borde)",
          fontSize: 13, color: "#374151",
        }}>
          <span style={{ fontSize: 18 }}>🌾</span>
          <span>
            Campo: <strong style={{ color: "var(--verde)" }}>{campoPrincipal.nombre}</strong>
            {" · "}{campoPrincipal.direccion}
            {" · "}{TIPOS_PASTURA.find(p => p.id === campoPrincipal.pastura)?.label}
          </span>
          <button
            onClick={() => nav("/campo")}
            style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--mono)", background: "transparent", border: "none", color: "var(--sub)", cursor: "pointer", textDecoration: "underline" }}
          >
            Cambiar
          </button>
        </div>
      )}

      {!campoPrincipal && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          padding: "10px 16px", borderRadius: 10,
          background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)",
          fontSize: 12, fontFamily: "var(--mono)", color: "#d97706",
        }}>
          <span>⚠️</span>
          <span>Configurá tu campo para mejores resultados con el clima</span>
          <button
            onClick={() => nav("/campo")}
            style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--mono)", background: "transparent", border: "none", color: "#d97706", cursor: "pointer", textDecoration: "underline" }}
          >
            Configurar →
          </button>
        </div>
      )}

      <Stepper paso={paso} />

      {/* PASO 1 */}
      {paso === 1 && (
        <Card>
          <h2 style={{ fontSize: "clamp(18px,4vw,22px)", marginBottom: 6, color: "#0f172a" }}>📷 Fotografiá el animal</h2>
          <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 24 }}>
            Foto clara de cuerpo entero, de costado si es posible
          </p>
          <div style={{ border: "2px dashed #86efac", borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐄</div>
            <p style={{ color: "var(--sub)", fontSize: 14, marginBottom: 20 }}>Foto clara de cuerpo entero, de costado si es posible</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => camaraRef.current?.click()} style={{
                padding: "12px 22px", borderRadius: 10, border: "2px solid #bbf7d0",
                background: "#f0fdf4", color: "#166534", cursor: "pointer", fontSize: 14, fontWeight: 700,
              }}>
                📷 Sacar foto
              </button>
              <button onClick={() => fileRef.current?.click()} style={{
                padding: "12px 22px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14,
              }}>
                🖼️ Elegir de galería
              </button>
            </div>
            <p style={{ color: "var(--sub2)", fontSize: 11, marginTop: 12 }}>JPG · PNG · HEIC · Máx 15MB</p>
          </div>
          <input ref={fileRef}   type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
          <BtnSecondary style={{ width: "100%" }} onClick={sinFoto}>
            Continuar sin foto (estimación básica) →
          </BtnSecondary>
        </Card>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <Card>
          {fotoURL && (
            <img src={fotoURL} alt="Animal" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, marginBottom: 24 }} />
          )}
          <h2 style={{ fontSize: "clamp(18px,4vw,22px)", marginBottom: 6, color: "#0f172a" }}>📋 Datos del animal</h2>

          <Label>Tipo de animal</Label>
          <ChipGrid options={TIPOS_ANIMAL} value={tipoAnimal} onChange={setTipoAnimal} />

          <Label>Edad aproximada (meses)</Label>
          <Input type="number" min="1" max="120" placeholder="Ej: 18" value={edadMeses} onChange={(e) => setEdadMeses(e.target.value)} />

          {/* Pastura solo si no hay campo configurado */}
          {!campoPrincipal && (
            <>
              <Label>Tipo de pastura</Label>
              <ChipGrid options={TIPOS_PASTURA} value={pastura} onChange={setPastura} />
            </>
          )}

          {/* Ubicación solo si no hay campo configurado */}
          {!campoPrincipal && (
            <>
              <Label>Ubicación del campo</Label>
              <Input type="text" placeholder="Ej: Villaguay, Entre Ríos" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
            </>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <BtnSecondary onClick={() => setPaso(1)}>← Volver</BtnSecondary>
            <BtnPrimary onClick={analizar}>🤖 Analizar con IA</BtnPrimary>
          </div>
        </Card>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <>
          {loading ? (
            <Card style={{ textAlign: "center", padding: "64px 24px" }}>
              <Spinner />
              <p style={{ fontSize: 18, marginTop: 24, marginBottom: 10 }}>Analizando con IA...</p>
              <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 2 }}>
                🤖 Gemini Vision estimando peso<br />
                🌦️ Consultando clima{campoPrincipal ? ` en ${campoPrincipal.nombre}` : ""}<br />
                💰 Calculando valor de mercado<br />
                📈 Proyectando engorde
              </p>
            </Card>
          ) : resultado ? (
            <Resultado
              resultado={resultado}
              tipoAnimal={tipoAnimal}
              nombreAnimal={nombreAnimal}
              setNombreAnimal={setNombreAnimal}
              onGuardar={guardar}
              onReset={reset}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

// ── RESULTADO ─────────────────────────────────────────────────────────────────
function Resultado({ resultado, tipoAnimal, nombreAnimal, setNombreAnimal, onGuardar, onReset }) {
  const r = resultado;
  const ia = r.ia || {};
  const proy = r.proyecciones || {};
  const clima = r.clima || {};
  const tipoInfo = TIPOS_ANIMAL.find((t) => t.id === tipoAnimal) || {};
  const maxKg = proy.peso6m || ia.pesoEstimadoKg;

  return (
    <div className="fade-up">
      <Card>
        <div style={{ marginBottom: 4, fontSize: 10, letterSpacing: "0.2em", color: "var(--verde)", fontFamily: "var(--mono)" }}>
          ANÁLISIS COMPLETADO
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {r.fotoURL && <img src={r.fotoURL} alt="Animal" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />}
          <div>
            <h2 style={{ fontSize: 26, marginBottom: 4, color: "#0f172a" }}>{tipoInfo.icon} {tipoInfo.label}</h2>
            <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 10 }}>
              {r.animal?.edadMeses} meses · {r.animal?.pastura?.replace(/_/g," ")} · {r.animal?.ubicacion}
            </p>
            <span style={{
              display: "inline-block", padding: "3px 12px", borderRadius: 20,
              fontSize: 10, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.1em", color: "#fff",
              background: CONFIANZA_COLOR[ia.confianza] || "#64748b",
            }}>
              Confianza: {(ia.confianza || "—").toUpperCase()}
            </span>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
        <MetricaCard titulo="Peso Hoy" valor={`${ia.pesoEstimadoKg} kg`} color="#3b82f6" />
        <MetricaCard titulo="Cond. Corp." valor={`${ia.condicionCorporal}/9`} sub="estado de carnes" color="#8b5cf6" />
        <MetricaCard
          titulo="Clima Próx. 16 días"
          valor={clima.factorClima >= 1.05 ? "✅ Favorable" : clima.factorClima >= 0.9 ? "➡️ Normal" : "⚠️ Adverso"}
          sub={clima.lluvia != null ? `${clima.lluvia}mm · ${clima.tempMax || clima.temp}°C máx` : "Sin datos"}
          color={clima.factorClima >= 1.05 ? "#16a34a" : clima.factorClima >= 0.9 ? "#0891b2" : "#d97706"}
        />
        {r.satelital && (
          <MetricaCard
            titulo="🛰️ Pastura Satelital"
            valor={r.satelital.calidadPastura || "Analizada"}
            sub={`${r.satelital.coberturaVerde}% cobertura · ${r.satelital.estadoHidrico}`}
            color="#7c3aed"
          />
        )}
      </div>

      <Card>
        <SectionTitle>📈 PROYECCIÓN DE ENGORDE</SectionTitle>
        <ProyBar label="Hoy"     kg={ia.pesoEstimadoKg} maxKg={maxKg} color="#94a3b8" />
        <ProyBar label="3 meses" kg={proy.peso3m}       maxKg={maxKg} color="#2563eb" />
        <ProyBar label="6 meses" kg={proy.peso6m}       maxKg={maxKg} color="#16a34a" />
        <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 10 }}>
          Ganancia proyectada: <strong>+{proy.peso3m - ia.pesoEstimadoKg} kg</strong> en 3 meses · <strong>+{proy.peso6m - ia.pesoEstimadoKg} kg</strong> en 6 meses
        </p>
        <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 4 }}>
          Ritmo de engorde: <strong>{proy.ganDiaria} kg/día</strong> (pastura + clima próximo)
        </p>
        {clima.efectoDesc && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 8,
            background: clima.factorClima >= 1.05 ? "#f0fdf4" : clima.factorClima >= 0.9 ? "#f0f9ff" : "#fffbeb",
            border: `1px solid ${clima.factorClima >= 1.05 ? "#bbf7d0" : clima.factorClima >= 0.9 ? "#bae6fd" : "#fde68a"}`,
            fontSize: 13, color: "var(--texto)",
          }}>
            🌦️ <strong>Efecto climático:</strong> {clima.efectoDesc}
          </div>
        )}
        {r.satelital && (
          <div style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 8,
            background: "#faf5ff", border: "1px solid #e9d5ff", fontSize: 13, color: "#1e293b",
          }}>
            🛰️ <strong>Análisis satelital:</strong> {r.satelital.observacionesCampo}
            {r.satelital.recomendacionesCampo && (
              <div style={{ marginTop: 6, color: "#64748b" }}>💡 {r.satelital.recomendacionesCampo}</div>
            )}
          </div>
        )}
      </Card>

      <PreciosCard proy={proy} ia={ia} preciosRegionales={r.preciosRegionales} precios={r.precios} />

      <Card>
        <SectionTitle>🩺 EVALUACIÓN VETERINARIA IA</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.7, marginBottom: 10 }}>
          <strong style={{ color: "var(--texto)" }}>Observaciones:</strong> {ia.observaciones}
        </p>
        <p style={{ fontSize: 13, color: "var(--sub)", fontFamily: "var(--mono)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--texto)" }}>Recomendaciones:</strong> {ia.recomendaciones}
        </p>
      </Card>

      <Card>
        <SectionTitle>💾 GUARDAR EN STOCK</SectionTitle>
        <Input
          type="text"
          placeholder={`Ej: ${tipoInfo.label || "Animal"} Lote Norte`}
          value={nombreAnimal}
          onChange={(e) => setNombreAnimal(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <BtnSecondary onClick={onReset}>↩ Nuevo Análisis</BtnSecondary>
          <BtnPrimary onClick={onGuardar}>💾 Guardar en Stock</BtnPrimary>
        </div>
      </Card>
    </div>
  );
}

// ── PRECIOS CARD ──────────────────────────────────────────────────────────────
function PreciosCard({ proy, ia, preciosRegionales, precios }) {
  const [tab, setTab] = React.useState("liniers");
  const pr = proy || {};
  const reg = preciosRegionales || {};
  const liniers = pr.liniers || { hoy: pr.valorHoy, mes3: pr.valor3m, mes6: pr.valor6m, precioPorKg: precios?.liniers?.precioPorKg };
  const zona    = pr.zona    || { hoy: pr.valorHoy, mes3: pr.valor3m, mes6: pr.valor6m, precioPorKg: precios?.zona?.precioPorKg };

  const tabs = [
    { id: "liniers", label: "🏛️ Liniers", color: "#3b82f6" },
    { id: "zona",    label: "📍 Zona",    color: "#16a34a" },
  ];

  const data = tab === "liniers" ? liniers : zona;
  const color = tab === "liniers" ? "#3b82f6" : "#4ade80";

  return (
    <Card>
      <SectionTitle>💰 VALOR DE MERCADO</SectionTitle>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 12,
              fontFamily: "var(--mono)", cursor: "pointer",
              border: tab === t.id ? `1px solid ${t.color}` : "1px solid var(--borde)",
              background: tab === t.id ? `${t.color}18` : "transparent",
              color: tab === t.id ? t.color : "var(--sub)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fuente */}
      <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 14 }}>
        {tab === "liniers"
          ? `Precio Liniers: $${(data.precioPorKg||0).toLocaleString("es-AR")}/kg vivo`
          : `Precio zona: $${(data.precioPorKg||0).toLocaleString("es-AR")}/kg · ${reg.contexto || ""}`}
        {tab === "zona" && reg.diferencialVsLiniers !== undefined && (
          <span style={{ color: reg.diferencialVsLiniers >= 0 ? "#4ade80" : "#f87171", marginLeft: 8 }}>
            ({reg.diferencialVsLiniers >= 0 ? "+" : ""}{reg.diferencialVsLiniers}$/kg vs Liniers)
          </span>
        )}
      </p>

      {/* Valores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "HOY",     valor: data.hoy,  kg: ia.pesoEstimadoKg },
          { label: "3 MESES", valor: data.mes3, kg: pr.peso3m },
          { label: "6 MESES", valor: data.mes6, kg: pr.peso6m },
        ].map(item => (
          <div key={item.label} style={{
            background: `${color}08`, border: `1px solid ${color}25`,
            borderRadius: 10, padding: "14px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 6, letterSpacing: "0.1em" }}>{item.label}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color, fontFamily: "var(--mono)" }}>{formatPesos(item.valor)}</div>
            <div style={{ fontSize: 10, color: "var(--sub2)", marginTop: 4, fontFamily: "var(--mono)" }}>{item.kg} kg</div>
          </div>
        ))}
      </div>

      {/* Últimos remates zona */}
      {tab === "zona" && reg.ultimosRemates?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Últimos remates de referencia
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reg.ultimosRemates.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                padding: "10px 14px", borderRadius: 8,
                background: "#f8fafc", border: "1px solid #dcfce7",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--texto)", fontFamily: "var(--mono)" }}>
                    {r.lugar}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)" }}>
                    {r.fecha} · {r.categoria} · ~{r.pesoPromedio}kg
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#16a34a", fontFamily: "var(--mono)" }}>
                  ${(r.precioPorKg||0).toLocaleString("es-AR")}/kg
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "var(--sub2)", fontFamily: "var(--mono)", marginTop: 10 }}>
            * Estimación IA basada en mercado regional. Verificar en clicrural.com.ar
          </p>
        </div>
      )}

      {tab === "liniers" && (
        <p style={{ fontSize: 10, color: "var(--sub2)", fontFamily: "var(--mono)", marginTop: 4 }}>
          * {precios?.nota}
        </p>
      )}
    </Card>
  );
}
