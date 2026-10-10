import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, ClipboardList, Layers, Landmark, CloudSun, MapPin, ChevronRight, Settings, Sprout,
} from "lucide-react";
import { formatPesos } from "../utils/helpers.js";
import { getCotizaciones } from "../utils/api.js";
import { Card, IconTile, MetricaCard } from "../components/UI.jsx";

export default function Home({ stockCount, totales, campoPrincipal, user }) {
  const nav = useNavigate();
  const tieneCampo = !!campoPrincipal;
  const [novillo, setNovillo] = useState(null);

  useEffect(() => {
    getCotizaciones().then(d => setNovillo(d?.precios?.novillo || null)).catch(() => {});
  }, []);

  const accesos = [
    { icon: ClipboardList, label: "Hacienda", desc: `${stockCount} ${stockCount === 1 ? "animal" : "animales"}`, path: "/stock", color: "#2563eb", bg: "#eff6ff" },
    { icon: Layers,        label: "Lotes",    desc: "Organizá por potrero", path: "/lotes",   color: "#7c3aed", bg: "#f5f3ff" },
    { icon: Landmark,      label: "Liniers",  desc: novillo ? `Novillo $${novillo.toLocaleString("es-AR")}/kg` : "Precios del día", path: "/liniers", color: "#b45309", bg: "#fffbeb" },
    { icon: CloudSun,      label: "Clima",    desc: "Pronóstico 14 días", path: "/clima",   color: "#0891b2", bg: "#ecfeff" },
  ];

  return (
    <div className="page">
      {/* Saludo */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "var(--sub)", fontWeight: 500 }}>Hola, {user?.username}</p>
        <h1 style={{ fontSize: "clamp(24px,5vw,30px)", fontWeight: 800, marginTop: 2 }}>
          {tieneCampo ? campoPrincipal.nombre : "Bienvenido a GanaderIA"}
        </h1>
        {tieneCampo && campoPrincipal.direccion && (
          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--sub)", marginTop: 4 }}>
            <MapPin size={15} /> {campoPrincipal.direccion.split(",").slice(0, 2).join(",")}
          </p>
        )}
      </div>

      {!tieneCampo ? (
        <Card style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <IconTile icon={Sprout} size={56} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Empecemos por tu campo</h2>
          <p style={{ fontSize: 15, color: "var(--sub)", maxWidth: 420, margin: "0 auto 20px" }}>
            Marcá dónde está y qué pastura tiene. Con eso calculamos clima, engorde y precios de tu zona.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => nav("/campo")}>
            <MapPin size={18} /> Configurar mi campo
          </button>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          {stockCount > 0 && (
            <div className="grid-stats" style={{ marginBottom: 14 }}>
              <MetricaCard titulo="Capital hoy" valor={formatPesos(totales.valorHoy)} color="var(--verde-osc)" />
              <MetricaCard titulo="Animales" valor={stockCount} />
              <MetricaCard titulo="Kg en pie" valor={totales.pesoTotal.toLocaleString("es-AR")} />
            </div>
          )}

          {/* Acción principal */}
          <button onClick={() => nav("/analizar")} style={{
            display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left",
            padding: "18px 20px", borderRadius: "var(--radius)", border: "none", marginBottom: 14,
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff",
            boxShadow: "0 6px 20px rgba(22,163,74,0.3)",
          }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={26} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 18, fontWeight: 700 }}>Analizar un animal</span>
              <span style={{ display: "block", fontSize: 14, opacity: 0.9, marginTop: 2 }}>
                Sacale una foto y la IA estima peso, valor y engorde
              </span>
            </span>
            <ChevronRight size={22} style={{ opacity: 0.8, flexShrink: 0 }} />
          </button>

          {/* Accesos */}
          <div className="grid-acciones" style={{ marginBottom: 14 }}>
            {accesos.map(a => (
              <button key={a.path} className="card-link" onClick={() => nav(a.path)} style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <IconTile icon={a.icon} color={a.color} bg={a.bg} size={40} />
                <span style={{ minWidth: 0, width: "100%" }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "var(--texto)" }}>{a.label}</span>
                  <span className="num" style={{ display: "block", fontSize: 13, color: "var(--sub)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <button className="card-link" onClick={() => nav("/campo")} style={{ padding: "12px 16px" }}>
            <Settings size={18} color="var(--sub)" />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--texto2)" }}>Configuración del campo</span>
            <ChevronRight size={18} color="var(--sub2)" />
          </button>
        </>
      )}
    </div>
  );
}
