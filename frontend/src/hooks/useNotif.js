import { useState, useCallback } from "react";

export function useNotif() {
  const [notif, setNotif] = useState(null);

  const mostrar = useCallback((msg, tipo = "ok", duracion = 3500) => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), duracion);
  }, []);

  return { notif, mostrar };
}
