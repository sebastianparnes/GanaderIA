import { useState, useEffect } from "react";

const STORAGE_KEY = "ganader-ia-campos";

export function useCampos() {
  const [campos, setCampos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campos));
  }, [campos]);

  function guardarCampo(campo) {
    setCampos((prev) => {
      const existe = prev.findIndex((c) => c.id === campo.id);
      if (existe >= 0) {
        const nuevo = [...prev];
        nuevo[existe] = campo;
        return nuevo;
      }
      return [...prev, campo];
    });
  }

  const campoPrincipal = campos[0] || null;

  return { campos, guardarCampo, campoPrincipal };
}
