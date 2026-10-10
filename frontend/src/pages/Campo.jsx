import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Search, Satellite, Save, RefreshCw, CalendarDays, ClipboardList, Droplets, AlertTriangle, Leaf, Lightbulb,
} from "lucide-react";
import { Card, BtnPrimary, BtnSecondary, Label, ChipGrid, SectionTitle, PageHeader, Aviso, MetricaCard } from "../components/UI.jsx";
import { TIPOS_PASTURA } from "../utils/constants.js";
import { wxInfo, fmtDia } from "../utils/clima.js";

const API = import.meta.env.VITE_API_URL || "";

// ── HELPERS CLIMA ─────────────────────────────────────────────────────────────
async function fetchClima(lat, lon) {
  const res = await fetch(`${API}/api/clima?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  if (!data.daily?.time?.length) throw new Error(data.error || "Sin pronóstico");
  return data;
}

// ── LEAFLET ───────────────────────────────────────────────────────────────────
// Se carga una sola vez aunque el componente se monte varias veces
let leafletPromise = null;
function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return leafletPromise;
}

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="#16a34a" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`;

// ── COMPONENTE MAPA ───────────────────────────────────────────────────────────
function MapaPicker({ lat, lon, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Última ubicación conocida: el mapa puede terminar de cargar después de que llegue el campo
  const posRef = useRef({ lat, lon });
  posRef.current = { lat, lon };

  function ponerMarcador(L, la, lo) {
    const map = mapInstanceRef.current;
    if (markerRef.current) {
      markerRef.current.setLatLng([la, lo]);
      return;
    }
    const icon = L.divIcon({ html: PIN_SVG, iconSize: [34, 34], iconAnchor: [17, 32], className: "" });
    markerRef.current = L.marker([la, lo], { icon, draggable: true }).addTo(map);
    markerRef.current.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      onSelectRef.current(pos.lat, pos.lng);
    });
  }

  // Crear el mapa
  useEffect(() => {
    let cancelado = false;
    cargarLeaflet().then((L) => {
      if (cancelado || mapInstanceRef.current || !mapRef.current) return;
      const { lat: la, lon: lo } = posRef.current;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([la || -32.5, lo || -60.0], la ? 13 : 6);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      if (la && lo) ponerMarcador(L, la, lo);
      map.on("click", (e) => {
        ponerMarcador(L, e.latlng.lat, e.latlng.lng);
        onSelectRef.current(e.latlng.lat, e.latlng.lng);
      });
    }).catch(() => {});

    return () => {
      cancelado = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Mover el mapa cuando la ubicación cambia desde afuera (buscador o campo cargado)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lat || !lon || !window.L) return;
    ponerMarcador(window.L, lat, lon);
    const centro = map.getCenter();
    if (Math.abs(centro.lat - lat) > 0.01 || Math.abs(centro.lng - lon) > 0.01) {
      map.setView([lat, lon], Math.max(map.getZoom(), 13));
    }
  }, [lat, lon]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%", height: 320, borderRadius: 12,
        border: "1px solid var(--borde)", overflow: "hidden",
        background: "var(--bg2)", position: "relative", zIndex: 0,
      }}
    />
  );
}

// ── PRONÓSTICO ────────────────────────────────────────────────────────────────
function Pronostico({ clima }) {
  const { daily } = clima;
  return (
    <div>
      <SectionTitle icon={CalendarDays}>Pronóstico {daily.time.length} días</SectionTitle>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {daily.time.map((fecha, i) => {
          const wx = wxInfo(daily.weathercode[i]);
          const Icono = wx.icon;
          return (
            <div key={fecha} title={wx.txt} style={{
              minWidth: 70, padding: "10px 6px", borderRadius: 10, textAlign: "center",
              border: "1px solid var(--borde)", background: "#fff", flexShrink: 0,
            }}>
              <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 6, textTransform: "capitalize" }}>
                {i === 0 ? "Hoy" : fmtDia(fecha)}
              </div>
              <Icono size={22} color={wx.color} style={{ marginBottom: 4 }} />
              <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>{Math.round(daily.temperature_2m_max[i])}°</div>
              <div className="num" style={{ fontSize: 12, color: "var(--sub)" }}>{Math.round(daily.temperature_2m_min[i])}°</div>
              {daily.precipitation_sum[i] > 0.5 && (
                <div className="num" style={{ fontSize: 11, color: "#0369a1", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <Droplets size={10} />{Math.round(daily.precipitation_sum[i])}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function Campo({ campos, onGuardar, user }) {
  const nav = useNavigate();
  const campo = campos[0] || null; // por ahora un solo campo

  const [nombre, setNombre] = useState(campo?.nombre || "");
  const [lat, setLat] = useState(campo?.lat || null);
  const [lon, setLon] = useState(campo?.lon || null);
  const [direccion, setDireccion] = useState(campo?.direccion || "");
  const [pastura, setPastura] = useState(campo?.pastura || "");
  const [clima, setClima] = useState(campo?.clima?.daily ? campo.clima : null);
  const [loadingClima, setLoadingClima] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [satelital, setSatelital]           = useState(null);
  const [satelitalImg, setSatelitalImg]     = useState(null);
  const [loadingSatelital, setLoadingSatelital] = useState(false);
  const [loadingAnalisis, setLoadingAnalisis]   = useState(false);

  // Si el campo llega después del primer render (ej: recargando /campo), completar el formulario
  useEffect(() => {
    if (!campo) return;
    setNombre(campo.nombre || "");
    setLat(campo.lat || null);
    setLon(campo.lon || null);
    setDireccion(campo.direccion || "");
    setPastura(campo.pastura || "");
    if (campo.lat && campo.lon) cargarClima(campo.lat, campo.lon);
  }, [campo?.id]);

  async function analizarSatelital() {
    if (!lat || !lon) return;
    setSatelital(null);
    setLoadingSatelital(true);

    // Paso 1: mostrar imagen al toque
    try {
      const r = await fetch(`${API}/api/satelital/imagen?lat=${lat}&lon=${lon}`);
      const d = await r.json();
      if (d.imgUrl) setSatelitalImg(d.imgUrl);
    } catch(e) { console.error(e); }
    setLoadingSatelital(false);

    // Paso 2: análisis Gemini en segundo plano
    setLoadingAnalisis(true);
    try {
      const r = await fetch(`${API}/api/satelital?lat=${lat}&lon=${lon}&ubicacion=${encodeURIComponent(direccion || nombre)}`);
      const d = await r.json();
      if (!d.error) setSatelital(d);
      else console.warn("Análisis satelital:", d.error);
    } catch(e) { console.error(e); }
    finally { setLoadingAnalisis(false); }
  }

  async function cargarClima(la, lo) {
    setLoadingClima(true);
    try {
      setClima(await fetchClima(la, lo));
    } catch (e) {
      console.error("Error clima:", e);
    } finally {
      setLoadingClima(false);
    }
  }

  async function buscarUbicacion() {
    if (!busqueda.trim()) return;
    setLoadingGeo(true); setError("");
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(busqueda)}&count=5&language=es&format=json`
      );
      const data = await res.json();
      if (data.results?.length) {
        const r = data.results[0];
        setLat(r.latitude);
        setLon(r.longitude);
        setDireccion([r.name, r.admin1, r.country].filter(Boolean).join(", "));
        await cargarClima(r.latitude, r.longitude);
      } else {
        setError("No encontramos esa localidad. Probá con otro nombre o tocá el mapa.");
      }
    } catch {
      setError("No se pudo buscar la ubicación. Probá tocando el mapa.");
    } finally {
      setLoadingGeo(false);
    }
  }

  async function handleMapClick(la, lo) {
    setLat(la);
    setLon(lo);
    // Reverse geocoding con Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&accept-language=es`
      );
      const data = await res.json();
      const dir = data.display_name?.split(",").slice(0, 3).join(",") || `${la.toFixed(4)}, ${lo.toFixed(4)}`;
      setDireccion(dir);
    } catch {
      setDireccion(`${la.toFixed(4)}, ${lo.toFixed(4)}`);
    }
    cargarClima(la, lo);
  }

  async function guardar() {
    if (!nombre.trim()) { setError("Poné un nombre al campo."); return; }
    if (!pastura)       { setError("Elegí el tipo de pastura principal."); return; }
    if (!lat || !lon)   { setError("Marcá la ubicación del campo en el mapa."); return; }
    setError(""); setGuardando(true);
    const ok = await onGuardar({
      id: campo?.id || null,
      nombre: nombre.trim(), lat, lon, direccion, pastura, clima,
      actualizadoEn: new Date().toISOString(),
    });
    setGuardando(false);
    if (ok) nav("/");
    else setError("No se pudo guardar el campo. Probá de nuevo.");
  }

  return (
    <div className="page page-narrow">
      <PageHeader
        icon={MapPin}
        titulo="Mi campo"
        sub="Ubicación y pastura. Se usan en todos los análisis."
      />

      {/* Nombre */}
      <Card>
        <SectionTitle icon={ClipboardList}>Datos del campo</SectionTitle>
        <Label>Nombre del campo</Label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: La Esperanza, El Trébol..."
          style={{ width: "100%", padding: "11px 14px", fontSize: 15, marginBottom: 18 }}
        />

        <Label>Pastura principal</Label>
        <ChipGrid options={TIPOS_PASTURA} value={pastura} onChange={setPastura} />
      </Card>

      {/* Ubicación */}
      <Card>
        <SectionTitle icon={MapPin}>Ubicación</SectionTitle>

        <form onSubmit={(e) => { e.preventDefault(); buscarUbicacion(); }} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar localidad, ej: Villaguay"
            style={{ flex: 1, minWidth: 0, padding: "10px 14px", fontSize: 15 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loadingGeo} aria-label="Buscar">
            {loadingGeo ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
            <span className="ocultar-mobile">Buscar</span>
          </button>
        </form>

        {direccion ? (
          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--verde-txt)", fontWeight: 600, marginBottom: 10 }}>
            <MapPin size={15} style={{ flexShrink: 0 }} /> {direccion}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--sub)", marginBottom: 10 }}>
            También podés tocar el mapa o arrastrar el marcador.
          </p>
        )}

        <MapaPicker lat={lat} lon={lon} onSelect={handleMapClick} />

        {lat && lon && (
          <p className="num" style={{ fontSize: 12, color: "var(--sub2)", marginTop: 8 }}>
            {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        )}
      </Card>

      {/* Análisis Satelital */}
      {lat && lon && (
        <Card>
          <SectionTitle icon={Satellite}>Análisis satelital de pasturas</SectionTitle>
          <p style={{ fontSize: 14, color: "var(--sub)", marginBottom: 16, lineHeight: 1.5 }}>
            La IA mira la imagen satelital de tu campo y estima la calidad del pasto, la cobertura verde y el estado hídrico.
          </p>

          {!satelitalImg && !loadingSatelital && (
            <BtnSecondary icon={Satellite} onClick={analizarSatelital}>Ver mi campo desde el satélite</BtnSecondary>
          )}

          {loadingSatelital && (
            <p style={{ textAlign: "center", padding: "16px 0", color: "var(--sub)", fontSize: 14 }}>Cargando imagen satelital...</p>
          )}

          {/* Imagen satelital — aparece al toque */}
          {satelitalImg && (
            <div>
              <img src={satelitalImg} alt="Vista satelital del campo" style={{
                width: "100%", borderRadius: 12, marginBottom: 14, border: "1px solid var(--borde)",
              }} />

              {loadingAnalisis && (
                <Aviso tipo="violeta" style={{ marginBottom: 12, alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e9d5ff", borderTopColor: "#7c3aed", flexShrink: 0 }} />
                    La IA está analizando la pastura...
                  </span>
                </Aviso>
              )}

              {satelital && (
                <div className="fade-up">
                  <div className="grid-4" style={{ marginBottom: 12 }}>
                    <MetricaCard titulo="Cobertura verde" valor={`${satelital.coberturaVerde}%`} color="var(--verde-osc)" />
                    <MetricaCard titulo="Estado hídrico" valor={satelital.estadoHidrico} />
                    <MetricaCard titulo="Calidad pastura" valor={satelital.calidadPastura} />
                    <MetricaCard titulo="Factor engorde" valor={`${Math.round((satelital.factorPastura || 1) * 100)}%`} />
                  </div>
                  <Aviso tipo="violeta" icon={Leaf} style={{ marginBottom: 10 }}>
                    <strong>{satelital.tipoVegetacion}</strong>
                    <div style={{ marginTop: 4 }}>{satelital.observacionesCampo}</div>
                  </Aviso>
                  {satelital.recomendacionesCampo && (
                    <Aviso tipo="ok" icon={Lightbulb}>
                      <strong>Recomendación:</strong> {satelital.recomendacionesCampo}
                    </Aviso>
                  )}
                </div>
              )}

              <button onClick={analizarSatelital} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
                <RefreshCw size={14} /> Actualizar análisis
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Pronóstico */}
      {(loadingClima || clima) && (
        <Card>
          {loadingClima && !clima ? (
            <p style={{ textAlign: "center", padding: "20px 0", fontSize: 14, color: "var(--sub)" }}>Cargando pronóstico...</p>
          ) : (
            <Pronostico clima={clima} />
          )}
        </Card>
      )}

      {error && <Aviso tipo="error" icon={AlertTriangle} style={{ marginBottom: 14 }}>{error}</Aviso>}

      {/* Guardar */}
      <BtnPrimary icon={Save} tam="lg" className="btn-block" onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : campo ? "Guardar cambios" : "Guardar campo"}
      </BtnPrimary>
    </div>
  );
}
