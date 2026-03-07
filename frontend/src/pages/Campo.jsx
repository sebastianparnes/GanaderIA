import { useState, useEffect, useRef } from "react";
import { Card, BtnPrimary, BtnSecondary, Label, ChipGrid, SectionTitle } from "../components/UI.jsx";
import { TIPOS_PASTURA } from "../utils/constants.js";

// ── HELPERS CLIMA ─────────────────────────────────────────────────────────────
async function fetchClima(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,weathercode&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=14`
  );
  return res.json();
}

const WX_ICONS = {
  0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️",
  45:"🌫️", 48:"🌫️",
  51:"🌦️", 53:"🌦️", 55:"🌧️",
  61:"🌧️", 63:"🌧️", 65:"🌧️",
  71:"🌨️", 73:"🌨️", 75:"❄️",
  80:"🌦️", 81:"🌧️", 82:"⛈️",
  95:"⛈️", 96:"⛈️", 99:"⛈️",
};

function wxIcon(code) { return WX_ICONS[code] || "🌡️"; }

function formatFechaDia(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

// ── COMPONENTE MAPA ───────────────────────────────────────────────────────────
function MapaPicker({ lat, lon, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    if (mapInstanceRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L;
      const initLat = lat || -32.5;
      const initLon = lon || -60.0;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([initLat, initLon], lat ? 13 : 6);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">📍</div>`,
        iconSize: [28, 28], iconAnchor: [14, 28], className: "",
      });

      if (lat && lon) {
        markerRef.current = L.marker([lat, lon], { icon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onSelect(pos.lat, pos.lng);
        });
      }

      map.on("click", (e) => {
        const { lat: la, lng: lo } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([la, lo]);
        } else {
          markerRef.current = L.marker([la, lo], { icon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", (ev) => {
            const pos = ev.target.getLatLng();
            onSelect(pos.lat, pos.lng);
          });
        }
        onSelect(la, lo);
      });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%", height: 320, borderRadius: 12,
        border: "1px solid var(--borde)", overflow: "hidden",
        background: "#ffffff",
      }}
    />
  );
}

// ── PRONÓSTICO ────────────────────────────────────────────────────────────────
function Pronostico({ clima }) {
  if (!clima) return null;
  const { daily } = clima;

  return (
    <div>
      <SectionTitle>🌦️ Pronóstico 14 días</SectionTitle>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {daily.time.map((fecha, i) => (
          <div
            key={fecha}
            style={{
              minWidth: 80, padding: "12px 8px", borderRadius: 10, textAlign: "center",
              border: "1px solid var(--borde)", background: "#f8fafc",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 10, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 6 }}>
              {formatFechaDia(fecha)}
            </div>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{wxIcon(daily.weathercode[i])}</div>
            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#0f172a", fontWeight: 700 }}>
              {Math.round(daily.temperature_2m_max[i])}°
            </div>
            <div style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)" }}>
              {Math.round(daily.temperature_2m_min[i])}°
            </div>
            {daily.precipitation_sum[i] > 0 && (
              <div style={{ fontSize: 10, color: "#0891b2", fontFamily: "var(--mono)", marginTop: 4 }}>
                {Math.round(daily.precipitation_sum[i])}mm
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "var(--sub2)", fontFamily: "var(--mono)", marginTop: 8 }}>
        Fuente: Open-Meteo · Datos gratuitos
      </p>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function Campo({ campos, onGuardar, user }) {
  const campo = campos[0] || null; // por ahora un solo campo

  const [nombre, setNombre] = useState(campo?.nombre || "");
  const [lat, setLat] = useState(campo?.lat || null);
  const [lon, setLon] = useState(campo?.lon || null);
  const [direccion, setDireccion] = useState(campo?.direccion || "");
  const [pastura, setPastura] = useState(campo?.pastura || "");
  const [clima, setClima] = useState(campo?.clima || null);
  const [loadingClima, setLoadingClima] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Si ya tiene coordenadas, cargar clima
  useEffect(() => {
    if (lat && lon && !clima) cargarClima(lat, lon);
  }, []);

  async function cargarClima(la, lo) {
    setLoadingClima(true);
    try {
      const data = await fetchClima(la, lo);
      setClima(data);
    } catch (e) {
      console.error("Error clima:", e);
    } finally {
      setLoadingClima(false);
    }
  }

  async function buscarUbicacion() {
    if (!busqueda.trim()) return;
    setLoadingGeo(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(busqueda)}&count=5&language=es&format=json`
      );
      const data = await res.json();
      if (data.results?.length) {
        const r = data.results[0];
        setLat(r.latitude);
        setLon(r.longitude);
        setDireccion(`${r.name}, ${r.admin1 || ""}, ${r.country || ""}`);
        await cargarClima(r.latitude, r.longitude);
      } else {
        alert("No se encontró la ubicación. Probá con otro nombre o hacé clic en el mapa.");
      }
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

  function guardar() {
    if (!nombre.trim()) { alert("Poné un nombre al campo"); return; }
    if (!lat || !lon)   { alert("Seleccioná la ubicación en el mapa"); return; }
    if (!pastura)       { alert("Seleccioná el tipo de pastura"); return; }
    onGuardar({
      id: campo?.id || null,
      nombre, lat, lon, direccion, pastura, clima,
      actualizadoEn: new Date().toISOString(),
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--verde)", fontFamily: "var(--mono)", marginBottom: 6 }}>
          CONFIGURACIÓN
        </div>
        <h2 style={{ fontSize: 26, color: "#0f172a", marginBottom: 6 }}>🌾 Mi Campo</h2>
        <p style={{ fontSize: 13, color: "var(--sub)", fontFamily: "var(--mono)" }}>
          Configurá la ubicación y pastura de tu campo. Estos datos se usan en todos los análisis.
        </p>
      </div>

      {/* Nombre */}
      <Card>
        <SectionTitle>📋 DATOS DEL CAMPO</SectionTitle>
        <Label>Nombre del campo</Label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: La Esperanza, El Trebol..."
          style={{ width: "100%", padding: "11px 14px", fontSize: 15, marginBottom: 18, borderRadius: 8 }}
        />

        <Label>Tipo de pastura principal</Label>
        <ChipGrid options={TIPOS_PASTURA} value={pastura} onChange={setPastura} />
      </Card>

      {/* Ubicación */}
      <Card>
        <SectionTitle>📍 UBICACIÓN</SectionTitle>

        {/* Buscador */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarUbicacion()}
            placeholder="Buscar localidad... ej: Villaguay"
            style={{ flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 8 }}
          />
          <BtnPrimary onClick={buscarUbicacion} style={{ padding: "10px 18px", fontSize: 13 }}>
            {loadingGeo ? "..." : "🔍 Buscar"}
          </BtnPrimary>
        </div>

        {direccion && (
          <p style={{ fontSize: 12, color: "var(--verde)", fontFamily: "var(--mono)", marginBottom: 12 }}>
            📍 {direccion}
          </p>
        )}

        <p style={{ fontSize: 11, color: "var(--sub)", fontFamily: "var(--mono)", marginBottom: 10 }}>
          También podés hacer clic directo en el mapa o arrastrar el marcador 📌
        </p>

        <MapaPicker lat={lat} lon={lon} onSelect={handleMapClick} />

        {lat && lon && (
          <p style={{ fontSize: 11, color: "var(--sub2)", fontFamily: "var(--mono)", marginTop: 8 }}>
            Coordenadas: {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        )}
      </Card>

      {/* Pronóstico */}
      <Card>
        {loadingClima ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌦️</div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--sub)" }}>Cargando pronóstico...</p>
          </div>
        ) : clima ? (
          <Pronostico clima={clima} />
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--sub)" }}>
              Seleccioná la ubicación para ver el pronóstico
            </p>
          </div>
        )}
      </Card>

      {/* Guardar */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <BtnPrimary onClick={guardar} style={{ padding: "14px 32px", fontSize: 15 }}>
          {guardado ? "✅ Guardado!" : "💾 Guardar Campo"}
        </BtnPrimary>
      </div>
    </div>
  );
}
