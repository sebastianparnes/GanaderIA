import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

export function useStock(user) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) cargar();
  }, [user?.id]);

  async function cargar() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/stock/${user.id}`);
      const d = await r.json();
      setStock(d.stock || []);
    } catch(e) { console.error("Error cargando stock:", e); }
    finally { setLoading(false); }
  }

  async function agregarAnimal(animal) {
    try {
      const { nombre, fotoURL, campo, ...rest } = animal;
      const r = await fetch(`${API}/api/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: user.id, nombre, fotoURL, campo, ...rest }),
      });
      const d = await r.json();
      if (d.ok) {
        const nuevo = { id: d.id, nombre, fotoURL, campo, guardado_en: new Date().toISOString(), ...rest };
        setStock(prev => [nuevo, ...prev]);
        return nuevo;
      }
    } catch(e) { console.error("Error agregando animal:", e); }
  }

  async function eliminarAnimal(id) {
    try {
      await fetch(`${API}/api/stock/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, usuario_id: user.id }),
      });
      setStock(prev => prev.filter(a => a.id !== id));
    } catch(e) { console.error("Error eliminando animal:", e); }
  }

  const totales = stock.reduce(
    (acc, a) => {
      const val = a.proyecciones;
      acc.valorHoy  += val?.valorHoy  || 0;
      acc.valor3m   += val?.valor3m   || 0;
      acc.valor6m   += val?.valor6m   || 0;
      acc.pesoTotal += a.ia?.pesoEstimadoKg || 0;
      return acc;
    },
    { valorHoy: 0, valor3m: 0, valor6m: 0, pesoTotal: 0 }
  );

  return { stock, agregarAnimal, eliminarAnimal, totales, loading };
}
