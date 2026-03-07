import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Analizar from "./pages/Analizar.jsx";
import Stock from "./pages/Stock.jsx";
import { Notif } from "./components/UI.jsx";
import { useStock } from "./hooks/useStock.js";
import { useNotif } from "./hooks/useNotif.js";

export default function App() {
  const { stock, agregarAnimal, eliminarAnimal, totales } = useStock();
  const { notif, mostrar } = useNotif();

  return (
    <>
      <Notif notif={notif} />
      <Header stockCount={stock.length} />
      <Routes>
        <Route path="/"         element={<Home stockCount={stock.length} />} />
        <Route path="/analizar" element={<Analizar onGuardar={agregarAnimal} notif={mostrar} />} />
        <Route path="/stock"    element={<Stock stock={stock} onEliminar={eliminarAnimal} totales={totales} />} />
      </Routes>
    </>
  );
}
