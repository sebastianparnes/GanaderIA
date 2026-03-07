import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000, // 60s (Claude Vision puede tardar)
});

/**
 * Analiza un animal con o sin foto.
 * @param {object} datos - { tipoAnimal, edadMeses, pastura, ubicacion }
 * @param {File|null} fotoFile - archivo de imagen (opcional)
 */
export async function analizarAnimal(datos, fotoFile = null) {
  const formData = new FormData();
  formData.append("tipoAnimal", datos.tipoAnimal);
  formData.append("edadMeses", datos.edadMeses);
  formData.append("pastura", datos.pastura);
  formData.append("ubicacion", datos.ubicacion);
  if (datos.lat) formData.append("lat", datos.lat);
  if (datos.lon) formData.append("lon", datos.lon);
  if (fotoFile) {
    formData.append("foto", fotoFile);
  }

  const res = await api.post("/analizar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Trae cotizaciones de referencia de Liniers.
 */
export async function getCotizaciones() {
  const res = await api.get("/liniers");
  return res.data;
}

export default api;
