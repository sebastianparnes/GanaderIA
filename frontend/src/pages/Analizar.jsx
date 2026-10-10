import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analizarAnimal } from "../utils/api.js";
import { TIPOS_ANIMAL, TIPOS_PASTURA, CONFIANZA_COLOR } from "../utils/constants.js";
import { formatPesos } from "../utils/helpers.js";
import {
  Camera, Images, ArrowLeft, ArrowRight, Sparkles, MapPin, AlertTriangle, Scale, CloudSun,
  Wallet, TrendingUp, Stethoscope, Satellite, Save, RotateCcw, CheckCircle2,
} from "lucide-react";
import {
  Card, ChipGrid, Label, Input, BtnPrimary, BtnSecondary, BtnGhost, IconTile, Aviso,
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
    // Con campo configurado, pastura y ubicación salen del campo (el campo puede cargar después del primer render)
    const pasturaFinal   = campoPrincipal?.pastura   || pastura;
    const ubicacionFinal = campoPrincipal?.direccion || ubicacion;
    if (!tipoAnimal || !edadMeses) {
      notif("Elegí la categoría y la edad del animal", "error"); return;
    }
    if (!pasturaFinal || !ubicacionFinal) {
      notif("Completá la pastura y la ubicación", "error"); return;
    }
    setLoading(true);
    setPaso(3);
    try {
      // Si tenemos coordenadas del campo, pasarlas al backend
      const datos = {
        tipoAnimal, edadMeses, pastura: pasturaFinal, ubicacion: ubicacionFinal,
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
    notif(`${nombre} guardado en la hacienda`);
    nav("/stock");
  }

  return (
    <div className="page page-narrow">

      {campoPrincipal ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
          padding: "10px 14px", borderRadius: "var(--radius-sm)",
          background: "#fff", border: "1px solid var(--borde)", fontSize: 13, color: "var(--texto2)",
        }}>
          <MapPin size={16} color="var(--verde)" style={{ flexShrink: 0 }} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong>{campoPrincipal.nombre}</strong>
            {" · "}{TIPOS_PASTURA.find(p => p.id === campoPrincipal.pastura)?.label}
            {" · "}{campoPrincipal.direccion?.split(",")[0]}
          </span>
          <button onClick={() => nav("/campo")} className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", minHeight: 0, padding: "4px 8px" }}>
            Cambiar
          </button>
        </div>
      ) : (
        <Aviso tipo="warn" icon={AlertTriangle} style={{ marginBottom: 18 }}>
          Configurá tu campo para que el análisis use el clima y la pastura reales.{" "}
          <button onClick={() => nav("/campo")} style={{ background: "none", border: "none", padding: 0, color: "inherit", fontWeight: 700, textDecoration: "underline", fontSize: "inherit" }}>
            Configurar
          </button>
        </Aviso>
      )}

      <Stepper paso={paso} />

      {/* PASO 1 */}
      {paso === 1 && (
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Fotografiá el animal</h2>
          <p style={{ fontSize: 14, color: "var(--sub)", marginBottom: 20 }}>
            De costado y de cuerpo entero, con buena luz. Así la estimación de peso es más precisa.
          </p>
          <div style={{
            border: "2px dashed var(--verde-border)", borderRadius: "var(--radius)", background: "#fbfefc",
            padding: "28px 20px", textAlign: "center", marginBottom: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <IconTile icon={Camera} size={56} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <BtnPrimary icon={Camera} onClick={() => camaraRef.current?.click()}>Sacar foto</BtnPrimary>
              <BtnSecondary icon={Images} onClick={() => fileRef.current?.click()}>Elegir de galería</BtnSecondary>
            </div>
            <p style={{ color: "var(--sub2)", fontSize: 12, marginTop: 14 }}>JPG · PNG · HEIC · hasta 15 MB</p>
          </div>
          <input ref={fileRef}   type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFoto} />
          <BtnGhost className="btn-block" onClick={sinFoto}>
            Continuar sin foto (estimación básica) <ArrowRight size={16} />
          </BtnGhost>
        </Card>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <Card style={{ padding: 24 }}>
          {fotoURL && (
            <img src={fotoURL} alt="Animal" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 20 }} />
          )}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Datos del animal</h2>

          <Label>Categoría</Label>
          <ChipGrid options={TIPOS_ANIMAL} value={tipoAnimal} onChange={setTipoAnimal} />

          <Label>Edad aproximada (meses)</Label>
          <Input type="number" inputMode="numeric" min="1" max="120" placeholder="Ej: 18" value={edadMeses} onChange={(e) => setEdadMeses(e.target.value)} style={{ maxWidth: 200 }} />

          {/* Pastura y ubicación solo si no hay campo configurado */}
          {!campoPrincipal && (
            <>
              <Label>Tipo de pastura</Label>
              <ChipGrid options={TIPOS_PASTURA} value={pastura} onChange={setPastura} />
              <Label>Ubicación del campo</Label>
              <Input type="text" placeholder="Ej: Villaguay, Entre Ríos" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
            </>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8 }}>
            <BtnSecondary icon={ArrowLeft} onClick={() => setPaso(1)}>Volver</BtnSecondary>
            <BtnPrimary icon={Sparkles} onClick={analizar}>Analizar con IA</BtnPrimary>
          </div>
        </Card>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <>
          {loading ? (
            <Card style={{ textAlign: "center", padding: "48px 24px" }}>
              <Spinner />
              <p style={{ fontSize: 18, fontWeight: 700, marginTop: 20, marginBottom: 16 }}>Analizando con IA...</p>
              <div style={{ display: "inline-flex", flexDirection: "column", gap: 10, textAlign: "left", fontSize: 14, color: "var(--sub)" }}>
                {[
                  [Scale, "Estimando peso y estado corporal"],
                  [CloudSun, `Consultando clima${campoPrincipal ? ` en ${campoPrincipal.nombre}` : ""}`],
                  [Wallet, "Calculando valor de mercado"],
                  [TrendingUp, "Proyectando engorde"],
                ].map(([Icono, txt]) => (
                  <span key={txt} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icono size={16} color="var(--verde)" /> {txt}
                  </span>
                ))}
              </div>
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
  const climaEstado = clima.factorClima >= 1.05 ? "favorable" : clima.factorClima >= 0.9 ? "normal" : "adverso";
  const CLIMA = {
    favorable: { txt: "Favorable", color: "var(--verde-osc)", aviso: "ok" },
    normal:    { txt: "Normal",    color: "#0e7490",          aviso: "info" },
    adverso:   { txt: "Adverso",   color: "var(--ambar)",     aviso: "warn" },
  }[climaEstado];
  const confColor = CONFIANZA_COLOR[ia.confianza] || "#64748b";

  return (
    <div className="fade-up">
      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {r.fotoURL && <img src={r.fotoURL} alt="Animal" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--verde)", marginBottom: 4 }}>
              <CheckCircle2 size={14} /> Análisis completado
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{tipoInfo.label}</h2>
            <p style={{ fontSize: 13, color: "var(--sub)", marginTop: 2 }}>
              {r.animal?.edadMeses} meses · {TIPOS_PASTURA.find(p => p.id === r.animal?.pastura)?.label || r.animal?.pastura?.replace(/_/g, " ")}
            </p>
            <span style={{
              display: "inline-block", marginTop: 8, padding: "2px 10px", borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: confColor, background: `${confColor}14`, border: `1px solid ${confColor}40`,
            }}>
              Confianza {ia.confianza || "—"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid-4" style={{ marginBottom: 14, gridTemplateColumns: r.satelital ? undefined : "repeat(auto-fit,minmax(140px,1fr))" }}>
        <MetricaCard icon={Scale} titulo="Peso hoy" valor={`${ia.pesoEstimadoKg} kg`} />
        <MetricaCard icon={Stethoscope} titulo="Condición corporal" valor={`${ia.condicionCorporal}/9`} />
        <MetricaCard
          icon={CloudSun}
          titulo="Clima 16 días"
          valor={CLIMA.txt}
          sub={clima.lluvia != null ? `${clima.lluvia} mm · ${clima.tempMax || clima.temp}°C máx` : "Sin datos"}
          color={CLIMA.color}
        />
        {r.satelital && (
          <MetricaCard
            icon={Satellite}
            titulo="Pastura satelital"
            valor={r.satelital.calidadPastura || "Analizada"}
            sub={`${r.satelital.coberturaVerde}% cobertura verde`}
            color="#6d28d9"
          />
        )}
      </div>

      <Card>
        <SectionTitle icon={TrendingUp}>Proyección de engorde</SectionTitle>
        <ProyBar label="Hoy"     kg={ia.pesoEstimadoKg} maxKg={maxKg} color="#94a3b8" />
        <ProyBar label="3 meses" kg={proy.peso3m}       maxKg={maxKg} color="#4ade80" />
        <ProyBar label="6 meses" kg={proy.peso6m}       maxKg={maxKg} color="var(--verde)" />
        <p className="num" style={{ fontSize: 14, color: "var(--sub)", marginTop: 6 }}>
          <strong style={{ color: "var(--texto)" }}>+{proy.peso3m - ia.pesoEstimadoKg} kg</strong> en 3 meses ·{" "}
          <strong style={{ color: "var(--texto)" }}>+{proy.peso6m - ia.pesoEstimadoKg} kg</strong> en 6 meses ·{" "}
          {proy.ganDiaria} kg/día
        </p>
        {clima.efectoDesc && (
          <Aviso tipo={CLIMA.aviso} icon={CloudSun} style={{ marginTop: 14 }}>
            <strong>Efecto del clima:</strong> {clima.efectoDesc}
          </Aviso>
        )}
        {r.satelital && (
          <Aviso tipo="violeta" icon={Satellite} style={{ marginTop: 10 }}>
            <strong>Análisis satelital:</strong> {r.satelital.observacionesCampo}
            {r.satelital.recomendacionesCampo && (
              <div style={{ marginTop: 6, opacity: 0.85 }}>{r.satelital.recomendacionesCampo}</div>
            )}
          </Aviso>
        )}
      </Card>

      <PreciosCard proy={proy} ia={ia} precios={r.precios} />

      <Card>
        <SectionTitle icon={Stethoscope}>Evaluación de la IA</SectionTitle>
        <p style={{ fontSize: 14, color: "var(--texto2)", lineHeight: 1.6, marginBottom: 10 }}>
          <strong>Observaciones:</strong> {ia.observaciones}
        </p>
        <p style={{ fontSize: 14, color: "var(--texto2)", lineHeight: 1.6 }}>
          <strong>Recomendaciones:</strong> {ia.recomendaciones}
        </p>
      </Card>

      <Card>
        <SectionTitle icon={Save}>Guardar en la hacienda</SectionTitle>
        <Label>Nombre o caravana (opcional)</Label>
        <Input
          type="text"
          placeholder={`Ej: ${tipoInfo.label || "Animal"} lote norte`}
          value={nombreAnimal}
          onChange={(e) => setNombreAnimal(e.target.value)}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <BtnSecondary icon={RotateCcw} onClick={onReset}>Nuevo análisis</BtnSecondary>
          <BtnPrimary icon={Save} onClick={onGuardar}>Guardar</BtnPrimary>
        </div>
      </Card>
    </div>
  );
}

// ── PRECIOS CARD ──────────────────────────────────────────────────────────────
function PreciosCard({ proy, ia, precios }) {
  const [tab, setTab] = React.useState("liniers");
  const pr = proy || {};
  const liniers = pr.liniers || { hoy: pr.valorHoy, mes3: pr.valor3m, mes6: pr.valor6m, precioPorKg: precios?.liniers?.precioPorKg };
  const zona    = pr.zona    || { hoy: pr.valorHoy, mes3: pr.valor3m, mes6: pr.valor6m, precioPorKg: precios?.zona?.precioPorKg };
  const data = tab === "liniers" ? liniers : zona;
  const diferencial = precios?.zona?.diferencial;

  return (
    <Card>
      <SectionTitle icon={Wallet} accion={
        <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 999, padding: 3 }}>
          {[["liniers", "Liniers"], ["zona", "Tu zona"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "none",
              background: tab === id ? "#fff" : "transparent",
              color: tab === id ? "var(--texto)" : "var(--sub)",
              boxShadow: tab === id ? "var(--shadow)" : "none",
            }}>{label}</button>
          ))}
        </div>
      }>
        Valor de mercado
      </SectionTitle>

      <p className="num" style={{ fontSize: 13, color: "var(--sub)", marginBottom: 14 }}>
        ${(data.precioPorKg || 0).toLocaleString("es-AR")}/kg vivo
        {tab === "zona" && diferencial !== undefined && (
          <span style={{ color: diferencial >= 0 ? "var(--verde-osc)" : "var(--rojo)", marginLeft: 6 }}>
            ({diferencial >= 0 ? "+" : ""}{diferencial} $/kg vs Liniers)
          </span>
        )}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { label: "Hoy",     valor: data.hoy,  kg: ia.pesoEstimadoKg },
          { label: "3 meses", valor: data.mes3, kg: pr.peso3m },
          { label: "6 meses", valor: data.mes6, kg: pr.peso6m },
        ].map((item, i) => (
          <div key={item.label} style={{
            background: i === 0 ? "var(--bg2)" : "var(--verde-light)", borderRadius: "var(--radius-sm)",
            padding: "12px 4px", textAlign: "center", minWidth: 0,
          }}>
            <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
            <div className="num" style={{ fontSize: "clamp(13px,3.6vw,15px)", fontWeight: 800, color: i === 0 ? "var(--texto)" : "var(--verde-osc)", whiteSpace: "nowrap" }}>{formatPesos(item.valor)}</div>
            <div className="num" style={{ fontSize: 12, color: "var(--sub)", marginTop: 2 }}>{item.kg} kg</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--sub2)", marginTop: 12 }}>
        {tab === "liniers"
          ? "Precio promedio del último remate en el Mercado Agroganadero (Cañuelas)."
          : (precios?.zona?.contexto || "Liniers ± diferencial estimado por IA para tu zona.")}
      </p>
    </Card>
  );
}
