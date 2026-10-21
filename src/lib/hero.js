/* Ayudas para los bloques del hero (CardCta.astro y PromoCard.astro). */

/** Reduce una imagen de Sanity al ancho pedido (solo achica, mantiene el formato óptimo). */
export const imgUrl = (url, width) => (url ? `${url}?w=${width}&auto=format` : undefined);

/** Punto focal de Sanity (hotspot) → object-position CSS. */
export function hotspotPos(h) {
  return h && Number.isFinite(h.x) && Number.isFinite(h.y)
    ? `${(h.x * 100).toFixed(1)}% ${(h.y * 100).toFixed(1)}%`
    : "center";
}

export const isExternal = (href) => /^https?:\/\//i.test(href ?? "");

/** Enlace de WhatsApp con mensaje; sin número configurado, lleva al contacto del pie. */
export function whatsappHref(number, message) {
  const digits = String(number ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message ?? "")}` : "/#contacto";
}
