import { useState, useEffect } from "react";

const STORAGE_KEY = "ganader-ia-stock";

export function useStock() {
  const [stock, setStock] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stock));
  }, [stock]);

  function agregarAnimal(animal) {
    const nuevo = {
      id: Date.now(),
      guardadoEn: new Date().toISOString(),
      ...animal,
    };
    setStock((prev) => [nuevo, ...prev]);
    return nuevo;
  }

  function eliminarAnimal(id) {
    setStock((prev) => prev.filter((a) => a.id !== id));
  }

  function limpiarStock() {
    setStock([]);
  }

  // Totales calculados
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

  return { stock, agregarAnimal, eliminarAnimal, limpiarStock, totales };
}
