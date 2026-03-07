export const TIPOS_ANIMAL = [
  { id: "ternero",    label: "Ternero",    icon: "🐄", baseKg: 150 },
  { id: "ternera",    label: "Ternera",    icon: "🐄", baseKg: 140 },
  { id: "novillo",    label: "Novillo",    icon: "🐂", baseKg: 300 },
  { id: "novillito",  label: "Novillito",  icon: "🐂", baseKg: 230 },
  { id: "vaquillona", label: "Vaquillona", icon: "🐄", baseKg: 260 },
  { id: "vaca",       label: "Vaca",       icon: "🐄", baseKg: 380 },
  { id: "toro",       label: "Toro",       icon: "🐃", baseKg: 500 },
];

export const TIPOS_PASTURA = [
  { id: "campo_natural",   label: "Campo Natural",         factorEngorde: 0.6  },
  { id: "festuca",         label: "Festuca",               factorEngorde: 0.75 },
  { id: "alfalfa",         label: "Alfalfa",               factorEngorde: 1.0  },
  { id: "verdeo_invierno", label: "Verdeo de Invierno",    factorEngorde: 0.85 },
  { id: "verdeo_verano",   label: "Verdeo de Verano",      factorEngorde: 0.9  },
  { id: "confinamiento",   label: "Feed Lot",              factorEngorde: 1.2  },
  { id: "mixto",           label: "Mixto + suplemento",    factorEngorde: 1.1  },
];

export const CONFIANZA_COLOR = {
  alta:  "#16a34a",
  media: "#d97706",
  baja:  "#dc2626",
};

export const TIPO_EMOJI = {
  ternero: "🐄", ternera: "🐄", novillo: "🐂",
  novillito: "🐂", vaquillona: "🐄", vaca: "🐄", toro: "🐃",
};
