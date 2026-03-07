require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json({ limit: "20mb" }));
app.use("/api/", rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: "Demasiadas solicitudes." } }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Solo imágenes")),
});

const PRECIOS_LINIERS = {
  ternero:    { precio: 3200, tend: 0.03 },
  ternera:    { precio: 2900, tend: 0.025 },
  novillo:    { precio: 2650, tend: 0.02 },
  novillito:  { precio: 2750, tend: 0.022 },
  vaquillona: { precio: 2800, tend: 0.02 },
  vaca:       { precio: 2200, tend: 0.015 },
  toro:       { precio: 2400, tend: 0.018 },
};

const FACTOR_PASTURA = {
  campo_natural: 0.6, festuca: 0.75, alfalfa: 1.0,
  verdeo_invierno: 0.85, verdeo_verano: 0.9, confinamiento: 1.2, mixto: 1.1,
};

const BASE_KG = {
  ternero: 150, ternera: 140, novillo: 300,
  novillito: 230, vaquillona: 260, vaca: 380, toro: 500,
};

async function estimarPesoConGemini(tipoAnimal, edadMeses, pastura, ubicacion, base64Image, mediaType) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY no configurada en .env");

  const tipoLabel = { ternero:"Ternero", ternera:"Ternera", novillo:"Novillo", novillito:"Novillito", vaquillona:"Vaquillona", vaca:"Vaca", toro:"Toro" }[tipoAnimal] || tipoAnimal;
  const pasturaLabel = { campo_natural:"Campo Natural", festuca:"Festuca", alfalfa:"Alfalfa", verdeo_invierno:"Verdeo de Invierno", verdeo_verano:"Verdeo de Verano", confinamiento:"Feed Lot", mixto:"Mixto" }[pastura] || pastura;
  const baseKg = BASE_KG[tipoAnimal] || 250;

  const prompt = `Sos un veterinario experto en ganadería bovina argentina.
${base64Image ? "Analizá esta foto de un" : "Estimá el peso de un"} ${tipoLabel} de ${edadMeses} meses, que consume ${pasturaLabel} en ${ubicacion}.
Peso base esperado: ~${baseKg}kg.
Respondé SOLO con JSON válido sin markdown ni texto extra:
{"pesoEstimadoKg":250,"condicionCorporal":5,"confianza":"media","observaciones":"texto","recomendaciones":"texto"}`;

  const parts = [{ text: prompt }];
  if (base64Image) {
    parts.unshift({ inline_data: { mime_type: mediaType || "image/jpeg", data: base64Image } });
  }

  // URL corregida: v1 en lugar de v1beta, y modelo actualizado
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

  console.log("Llamando Gemini:", url.replace(GEMINI_KEY, "***"));

  const res = await axios.post(url, {
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
  }, { timeout: 30000 });

  const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("Gemini OK, respuesta:", text.substring(0, 150));

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return { pesoEstimadoKg: baseKg, condicionCorporal: 5, confianza: "baja", observaciones: "Estimación automática.", recomendaciones: "Tomá foto de cuerpo entero para mayor precisión." };
}

async function getClima(ubicacion) {
  try {
    const geoRes = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: ubicacion, count: 1, language: "es", format: "json" }, timeout: 5000,
    });
    if (!geoRes.data.results?.length) return { factorClima: 1.0, climaInfo: "Ubicación no encontrada", lluvia: null, temp: null };
    const { latitude, longitude, name } = geoRes.data.results[0];
    const wxRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: { latitude, longitude, daily: "precipitation_sum,temperature_2m_max", timezone: "America/Argentina/Buenos_Aires", forecast_days: 30 },
      timeout: 5000,
    });
    const lluvia = wxRes.data.daily.precipitation_sum.reduce((a, b) => a + b, 0);
    const temp = wxRes.data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / wxRes.data.daily.temperature_2m_max.length;
    const fLluvia = Math.min(1.3, Math.max(0.5, lluvia / 80));
    const fTemp = temp > 30 ? 0.8 : temp < 5 ? 0.7 : 1.0;
    return { factorClima: parseFloat(((fLluvia + fTemp) / 2).toFixed(3)), climaInfo: name, lluvia: Math.round(lluvia), temp: Math.round(temp) };
  } catch (e) {
    console.error("Error clima:", e.message);
    return { factorClima: 1.0, climaInfo: "Sin datos climáticos", lluvia: null, temp: null };
  }
}

function calcularProyecciones(peso, tipoAnimal, pastura, factorClima) {
  const fp = FACTOR_PASTURA[pastura] || 1.0;
  const ganDiaria = 0.7 * fp * factorClima;
  const peso3m = Math.round(peso + ganDiaria * 90);
  const peso6m = Math.round(peso + ganDiaria * 180);
  const p = PRECIOS_LINIERS[tipoAnimal];
  return {
    peso3m, peso6m,
    valorHoy: Math.round(peso   * p.precio),
    valor3m:  Math.round(peso3m * p.precio * Math.pow(1 + p.tend, 3)),
    valor6m:  Math.round(peso6m * p.precio * Math.pow(1 + p.tend, 6)),
    precioPorKgHoy: p.precio,
    ganDiaria: parseFloat(ganDiaria.toFixed(2)),
  };
}

// ── RUTAS ─────────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => res.json({ status: "ok", ia: "gemini-1.5-flash", timestamp: new Date().toISOString() }));

app.post("/api/analizar", upload.single("foto"), async (req, res) => {
  try {
    const { tipoAnimal, edadMeses, pastura, ubicacion } = req.body;
    if (!tipoAnimal || !edadMeses || !pastura || !ubicacion)
      return res.status(400).json({ error: "Faltan campos: tipoAnimal, edadMeses, pastura, ubicacion" });

    let base64Image = null, mediaType = null;
    if (req.file) {
      base64Image = req.file.buffer.toString("base64");
      mediaType = req.file.mimetype;
      console.log(`Foto recibida: ${req.file.originalname} (${Math.round(req.file.size/1024)}KB)`);
    }

    const [climaData, iaResult] = await Promise.all([
      getClima(ubicacion),
      estimarPesoConGemini(tipoAnimal, parseInt(edadMeses), pastura, ubicacion, base64Image, mediaType),
    ]);

    res.json({
      ok: true,
      animal: { tipo: tipoAnimal, edadMeses: parseInt(edadMeses), pastura, ubicacion },
      ia: iaResult,
      clima: climaData,
      proyecciones: calcularProyecciones(iaResult.pesoEstimadoKg, tipoAnimal, pastura, climaData.factorClima),
      precios: { fuente: "Referencia Mercado de Liniers", nota: "Verificar en mercadodeliniers.com.ar", precioPorKgHoy: PRECIOS_LINIERS[tipoAnimal].precio },
      generadoEn: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error en /api/analizar:", err.message);
    if (err.response?.data) console.error("Detalle API:", JSON.stringify(err.response.data).substring(0, 300));
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

app.get("/api/liniers", (req, res) => res.json({
  fuente: "Referencia estimada - Mercado de Liniers",
  categorias: Object.entries(PRECIOS_LINIERS).map(([k, v]) => ({ categoria: k, precioPorKgVivo: v.precio, tendenciaMensual: `+${(v.tend*100).toFixed(1)}%` })),
}));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/dist/index.html")));
}

app.listen(PORT, () => {
  console.log(`🐄 GanaderIA en puerto ${PORT} | IA: Gemini 2.0 Flash`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ configurada" : "❌ FALTA"}`);
});
