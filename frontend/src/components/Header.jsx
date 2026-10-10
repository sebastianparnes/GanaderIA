import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home, Camera, ClipboardList, Layers, Landmark, CloudSun, MapPin,
  MoreHorizontal, LogOut, User, ChevronRight,
} from "lucide-react";
import { Logo } from "./UI.jsx";

const NAV = [
  { path: "/",         label: "Inicio",   icon: Home },
  { path: "/stock",    label: "Hacienda", icon: ClipboardList },
  { path: "/analizar", label: "Analizar", icon: Camera },
  { path: "/lotes",    label: "Lotes",    icon: Layers },
  { path: "/liniers",  label: "Liniers",  icon: Landmark },
  { path: "/clima",    label: "Clima",    icon: CloudSun },
  { path: "/campo",    label: "Mi campo", icon: MapPin },
];

// En el celular la barra inferior muestra 4 accesos + "Más"
const MOBILE_PRINCIPALES = ["/", "/stock", "/analizar", "/lotes"];

export default function Header({ stockCount, tieneCampo, campoNombre, user, onLogout }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [masAbierto, setMasAbierto] = useState(false);

  const ir = (path) => { nav(path); setMasAbierto(false); };
  const activo = (path) => loc.pathname === path;
  const secundarios = NAV.filter(n => !MOBILE_PRINCIPALES.includes(n.path));
  const masActivo = secundarios.some(n => activo(n.path));

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 100, height: "var(--header-h)",
        display: "flex", alignItems: "center", gap: 16,
        padding: "0 20px", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--borde)",
      }}>
        <button onClick={() => ir("/")} aria-label="Inicio" style={{ background: "none", border: "none", padding: 0, flexShrink: 0 }}>
          <Logo size={32} />
        </button>

        {/* Desktop */}
        <nav className="nav-desktop" style={{ gap: 2, flex: 1, justifyContent: "center" }}>
          {NAV.filter(n => n.path !== "/").map(({ path, label, icon: Icono }) => (
            <button key={path} onClick={() => ir(path)} className={`nav-link ${activo(path) ? "activo" : ""}`} style={{ position: "relative" }}>
              <Icono size={17} />
              {label}
              {path === "/stock" && stockCount > 0 && (
                <span className="num" style={{ fontSize: 11, fontWeight: 700, background: activo(path) ? "#fff" : "var(--bg2)", color: "var(--sub)", padding: "1px 7px", borderRadius: 999 }}>
                  {stockCount}
                </span>
              )}
              {path === "/campo" && !tieneCampo && <PuntoAlerta />}
            </button>
          ))}
        </nav>

        <div className="nav-desktop" style={{ alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--texto2)", fontWeight: 600 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={15} />
            </span>
            {user?.username}
          </span>
          <button onClick={onLogout} className="btn btn-ghost btn-sm" title="Salir">
            <LogOut size={16} />
          </button>
        </div>

        {/* Mobile: campo actual a la derecha */}
        {campoNombre && (
          <button className="nav-mobile" onClick={() => ir("/campo")} style={{
            marginLeft: "auto", alignItems: "center", gap: 6, maxWidth: "55%",
            padding: "6px 10px", borderRadius: 999, border: "1px solid var(--borde)",
            background: "#fff", fontSize: 13, fontWeight: 600, color: "var(--texto2)",
          }}>
            <MapPin size={14} color="var(--verde)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campoNombre}</span>
          </button>
        )}
      </header>

      {/* Mobile: barra inferior */}
      <nav className="bottom-nav nav-mobile">
        {NAV.filter(n => MOBILE_PRINCIPALES.includes(n.path)).slice(0, 2).map(item => (
          <BotonInferior key={item.path} item={item} activo={activo(item.path)} onClick={() => ir(item.path)} />
        ))}
        <button onClick={() => ir("/analizar")} className={activo("/analizar") ? "activo" : ""} aria-label="Analizar animal">
          <span className="nav-central"><Camera size={24} /></span>
          Analizar
        </button>
        <BotonInferior item={NAV.find(n => n.path === "/lotes")} activo={activo("/lotes")} onClick={() => ir("/lotes")} />
        <button onClick={() => setMasAbierto(true)} className={masActivo ? "activo" : ""} style={{ position: "relative" }}>
          <MoreHorizontal size={22} />
          Más
          {!tieneCampo && <PuntoAlerta top={8} right="calc(50% - 16px)" />}
        </button>
      </nav>

      {masAbierto && (
        <>
          <div className="sheet-fondo" onClick={() => setMasAbierto(false)} />
          <div className="sheet" role="dialog" aria-label="Más opciones">
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--borde-fuerte)", margin: "0 auto 14px" }} />
            {secundarios.map(({ path, label, icon: Icono }) => (
              <button key={path} onClick={() => ir(path)} style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "14px 8px", border: "none", borderRadius: 10,
                background: activo(path) ? "var(--verde-light)" : "transparent",
                color: activo(path) ? "var(--verde-txt)" : "var(--texto)",
                fontSize: 16, fontWeight: 600, textAlign: "left",
              }}>
                <Icono size={20} color={activo(path) ? "var(--verde)" : "var(--sub)"} />
                {label}
                {path === "/campo" && !tieneCampo && (
                  <span style={{ fontSize: 12, color: "var(--ambar)", fontWeight: 600 }}>Sin configurar</span>
                )}
                <ChevronRight size={18} color="var(--sub2)" style={{ marginLeft: "auto" }} />
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--borde)", marginTop: 8, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 8px 0" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "var(--texto2)" }}>
                <User size={18} /> {user?.username}
              </span>
              <button onClick={() => { setMasAbierto(false); onLogout(); }} className="btn btn-secondary btn-sm">
                <LogOut size={15} /> Salir
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function BotonInferior({ item, activo, onClick }) {
  const Icono = item.icon;
  return (
    <button onClick={onClick} className={activo ? "activo" : ""}>
      <Icono size={22} strokeWidth={activo ? 2.4 : 2} />
      {item.label}
    </button>
  );
}

function PuntoAlerta({ top = 4, right = 4 }) {
  return <span style={{ position: "absolute", top, right, width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", border: "2px solid #fff" }} />;
}
