import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from "lucide-react";

// Código WMO (Open-Meteo) → ícono, color y descripción
export function wxInfo(code) {
  if (code === 0)                 return { icon: Sun,            color: "#f59e0b", txt: "Despejado" };
  if (code <= 2)                  return { icon: CloudSun,       color: "#f59e0b", txt: "Parcialmente nublado" };
  if (code === 3)                 return { icon: Cloud,          color: "#64748b", txt: "Nublado" };
  if (code === 45 || code === 48) return { icon: CloudFog,       color: "#64748b", txt: "Niebla" };
  if (code >= 51 && code <= 57)   return { icon: CloudDrizzle,   color: "#0891b2", txt: "Llovizna" };
  if (code >= 61 && code <= 67)   return { icon: CloudRain,      color: "#0369a1", txt: "Lluvia" };
  if (code >= 71 && code <= 77)   return { icon: CloudSnow,      color: "#0ea5e9", txt: "Nieve" };
  if (code >= 80 && code <= 82)   return { icon: CloudRain,      color: "#0369a1", txt: "Chaparrones" };
  if (code >= 95)                 return { icon: CloudLightning, color: "#7c3aed", txt: "Tormenta" };
  return { icon: Cloud, color: "#64748b", txt: "—" };
}

export function fmtDia(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
}

export function fmtDiaLargo(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}
