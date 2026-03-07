import { useState, useRef } from "react";
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
  const fileRef = useRef();

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
          background: "rgba(74,222,128,0.06)", border: "1px solid var(--borde)",
          fontSize: 12, fontFamily: "var(--mono)", color: "var(--sub)",
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
          <h2 style={{ fontSize: 22, marginBottom: 6, color: "#f0fdf0" }}>📷 Fotografiá el animal</h2>
          <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 24 }}>
            Foto clara de cuerpo entero, de costado si es posible
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed rgba(74,222,128,0.25)", borderRadius: 12,
              padding: "52px 24px", textAlign: "center", cursor: "pointer", marginBottom: 16,
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--verde)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(74,222,128,0.25)"}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐄</div>
            <p style={{ color: "var(--sub)", fontSize: 15, fontFamily: "var(--mono)", marginBottom: 4 }}>
              Hacé clic para tomar foto o subir imagen
            </p>
            <p style={{ color: "var(--sub2)", fontSize: 12, fontFamily: "var(--mono)" }}>JPG · PNG · HEIC · Máx 15MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
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
          <h2 style={{ fontSize: 22, marginBottom: 6, color: "#f0fdf0" }}>📋 Datos del animal</h2>

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
            <h2 style={{ fontSize: 26, marginBottom: 4, color: "#f0fdf0" }}>{tipoInfo.icon} {tipoInfo.label}</h2>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        <MetricaCard titulo="Peso Hoy" valor={`${ia.pesoEstimadoKg} kg`} color="#3b82f6" />
        <MetricaCard titulo="Cond. Corp." valor={`${ia.condicionCorporal}/9`} sub="estado de carnes" color="#8b5cf6" />
        <MetricaCard
          titulo="Factor Clima"
          valor={`${Math.round(clima.factorClima * 100)}%`}
          sub={clima.lluvia != null ? `${clima.lluvia}mm · ${clima.temp}°C` : "Sin datos"}
          color="#06b6d4"
        />
      </div>

      <Card>
        <SectionTitle>📈 PROYECCIÓN DE ENGORDE</SectionTitle>
        <ProyBar label="Hoy"     kg={ia.pesoEstimadoKg} maxKg={maxKg} color="#94a3b8" />
        <ProyBar label="3 meses" kg={proy.peso3m}       maxKg={maxKg} color="#3b82f6" />
        <ProyBar label="6 meses" kg={proy.peso6m}       maxKg={maxKg} color="#4ade80" />
        <p style={{ fontSize: 12, color: "var(--sub)", fontFamily: "var(--mono)", marginTop: 8 }}>
          Ganancia: +{proy.peso3m - ia.pesoEstimadoKg} kg en 3m · +{proy.peso6m - ia.pesoEstimadoKg} kg en 6m · {proy.ganDiaria} kg/día
        </p>
      </Card>

      <Card>
        <SectionTitle>💰 VALOR MERCADO DE LINIERS</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "HOY",     valor: proy.valorHoy, kg: ia.pesoEstimadoKg },
            { label: "3 MESES", valor: proy.valor3m,  kg: proy.peso3m },
            { label: "6 MESES", valor: proy.valor6m,  kg: proy.peso6m },
          ].map((item) => (
            <div key={item.label} style={{
              background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)",
              borderRadius: 10, padding: "14px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 6, letterSpacing: "0.1em" }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--verde)", fontFamily: "var(--mono)" }}>{formatPesos(item.valor)}</div>
              <div style={{ fontSize: 10, color: "var(--sub2)", marginTop: 4, fontFamily: "var(--mono)" }}>{item.kg} kg</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "var(--sub2)", fontFamily: "var(--mono)", marginTop: 12 }}>* {r.precios?.nota}</p>
      </Card>

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
