/* ==========================================================================
   Datos de contacto de la mutual. UN solo lugar: los usan la página /contacto,
   el pie de página y (el número de WhatsApp) el botón "Consultar" del menú.
   ➜ Reemplazá los valores de ejemplo por los reales.
   El número de WhatsApp NO va acá: se toma de PUBLIC_WHATSAPP_NUMBER (.env y Cloudflare).
   ========================================================================== */

export const CONTACT = {
  address: {
    street: "Lardizabal 762",      // ej.: "Av. San Martín 1234"
    city: "Marcos Juárez, Cordoba",               // ej.: "Rosario, Santa Fe"
    // Texto que busca Google Maps (mapa y botón "Cómo llegar"). Cuanto más completo, mejor.
    mapQuery: "Lardizabal 762, Marcos Juárez, Cordoba, Argentina",
  },

  // Una línea por franja. Para un día cerrado, escribí "Cerrado".
  hours: [
    { days: "Lunes a viernes", time: "8:00 a 12:30 hs | 16:30 a 19:30 hs" },
    { days: "Sábados", time: "9:30 a 12:30 hs | 16:00 a 19:30 hs" },
    { days: "Domingos y feriados", time: "Cerrado" },
  ],

  phone: {
    label: "3472 448707",                 // como se muestra
    tel: "+5493472448707",                    // para llamar con un toque (con código de país, sin espacios)
  },
  email: "coyspuhogar@coyspu.com.ar",

  // Dejá vacío ("") el que no tengas: no se muestra.
  social: {
    facebook: "",                            // ej.: "https://www.facebook.com/mutualcoyspu"
    instagram: "",                           // ej.: "https://www.instagram.com/mutualcoyspu"
  },

  // Mensaje que se arma al tocar el botón "Consultar" (WhatsApp)
  whatsappMessage: "Hola! Quisiera hacer una consulta.",
};

/** Enlace a Google Maps con la ubicación (abre la app en el celular). */
export const mapsLink = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/** Dirección del mapa incrustado (no requiere clave de API). */
export const mapsEmbed = (query) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
