/* ==========================================================================
   Helpers de producto compartidos por la tarjeta (ProductCard) y la página
   del producto (pages/productos/[slug].astro). Sin dependencias del navegador.
   ========================================================================== */
import { categoryMeta } from "./sanity.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
/** $ 1.234.567 con espacio no separable (no se parte en dos líneas) */
export const fmt = (n) => money.format(n).replace(/\s/g, " ");

/** Dirección de la página de un producto. */
export const productUrl = (p) => `/productos/${p.slug}`;

/** Sin stock: el campo `stock` existe y es 0 (o negativo), o es `false` si fuera un booleano.
    Si el campo no está cargado, se asume que hay stock. */
export function isOutOfStock(p) {
  if (p.stock === false) return true;
  return typeof p.stock === "number" && p.stock <= 0;
}

const safeHex = (h) => {
  const v = String(h ?? "").trim().replace(/^#?/, "#");
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v : "#cccccc";
};

/** Todo lo que necesitan las vistas, ya formateado. */
export function buildProductView(product) {
  const { name, code, brand, badge, oldPrice, price, installments, description, image, category, warranty } = product;

  // Colores: se descartan referencias rotas y se valida el código hexadecimal
  const colors = (product.colors ?? [])
    .filter((c) => c && c.name)
    .map((c) => ({ name: c.name, hex: safeHex(c.hex) }));

  // Lista de datos: características + atributos (excepto "Color", que va como círculos) + garantía
  const specs = [
    ...(product.features ?? []),
    ...(product.attributes ?? [])
      .filter((a) => a && a.key && a.value && a.key.trim().toLowerCase() !== "color")
      .map((a) => `${a.key}: ${a.value}`),
    ...(warranty ? [`Garantía: ${warranty} ${warranty === 1 ? "mes" : "meses"}`] : []),
  ];

  // El ícono y el tono vienen del departamento (el padre, si es una subcategoría)
  const meta = categoryMeta(category?.parentSlug ?? category?.slug);
  const hasDiscount = typeof oldPrice === "number" && oldPrice > price;
  const off = hasDiscount ? Math.round((1 - price / oldPrice) * 100) : 0;
  const hasInstallments = installments > 1;
  const outOfStock = isOutOfStock(product);

  // Imágenes. fit=max: Sanity solo reduce la imagen para que quepa, sin recortarla.
  const urls = (product.images?.length ? product.images : image ? [image] : []).filter(Boolean);
  const images = urls.map((u) => ({
    src: `${u}?w=1000&h=1000&fit=max&auto=format`,   // imagen de la página
    full: `${u}?w=2000&h=2000&fit=max&auto=format`,  // ampliada (pantalla completa)
    thumb: `${u}?w=160&h=160&fit=max&auto=format`,   // miniatura
    card: `${u}?w=800&h=800&fit=max&auto=format`,    // tarjeta
  }));

  const badges = [];
  if (badge) badges.push({ label: badge });
  if (hasDiscount && off > 0) badges.push({ label: `-${off}%`, off: true });
  if (outOfStock) badges.push({ label: "Sin stock", out: true });

  return {
    name,
    code: code ?? "",
    brand: brand ?? "",
    category,
    description: description ?? "",
    tone: meta.tone,
    icon: meta.icon,
    colors,
    specs,
    images,
    badges,
    hasDiscount,
    off,
    oldPrice: hasDiscount ? fmt(oldPrice) : "",
    oldPriceNumber: hasDiscount ? oldPrice : null,
    price: fmt(price),
    priceNumber: price,
    installments: hasInstallments ? installments : 0,
    perInstallment: hasInstallments ? fmt(Math.round(price / installments)) : "",
    outOfStock,
    url: productUrl(product),
  };
}

/** Productos relacionados: primero los de la misma categoría; si faltan, se completa con
    los del mismo departamento (la categoría padre, o la propia si ya es un departamento).
    `all` es la lista completa de productos; `limit` el máximo a devolver. */
export function getRelated(product, all, limit = 4) {
  const cat = product.category;
  if (!cat) return [];
  const dept = cat.parentSlug ?? cat.slug;
  const others = all.filter((p) => p.id !== product.id && p.slug);
  const sameCat = others.filter((p) => p.category?.slug === cat.slug);
  const sameDept = others.filter(
    (p) => p.category?.slug !== cat.slug && (p.category?.slug === dept || p.category?.parentSlug === dept)
  );
  // Con stock primero; dentro de cada grupo se conserva el orden (por nombre)
  const byStock = (a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b));
  return [...sameCat.sort(byStock), ...sameDept.sort(byStock)].slice(0, limit);
}
