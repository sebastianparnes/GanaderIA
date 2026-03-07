import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

export function useCampos(user) {
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) cargar();
  }, [user?.id]);

  async function cargar() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/campos/${user.id}`);
      const d = await r.json();
      setCampos(d.campos || []);
    } catch(e) { console.error("Error cargando campos:", e); }
    finally { setLoading(false); }
  }

  async function guardarCampo(campo) {
    try {
      const r = await fetch(`${API}/api/campos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...campo, usuario_id: user.id }),
      });
      const d = await r.json();
      if (d.ok) {
        const campoConId = { ...campo, id: campo.id || d.id };
        setCampos(prev => {
          const existe = prev.findIndex(c => c.id === campoConId.id);
          if (existe >= 0) { const n = [...prev]; n[existe] = campoConId; return n; }
          return [...prev, campoConId];
        });
        return campoConId;
      }
    } catch(e) { console.error("Error guardando campo:", e); }
  }

  const campoPrincipal = campos[0] || null;
  return { campos, guardarCampo, campoPrincipal, loading, recargar: cargar };
}
