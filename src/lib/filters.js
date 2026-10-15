/* ==========================================================================
   Filtros del catálogo (se calculan en el build, a partir de los productos
   que muestra cada página de categoría).

   - Generales: precio, marca y cuotas.
   - Específicos: salen de los atributos clave/valor de los productos en Sanity
     (campo `atributos`: Rodado, Resolución, Pulgadas, RAM, etc.). Cada clave que
     aparece en los productos de la categoría se convierte en un grupo de filtro.

   Normalización: "Rodado", "rodado " y "RODADO" son la misma clave; "8 GB" y "8gb"
   NO se unifican (los espacios sobrantes, mayúsculas y tildes sí se ignoran).
   Conviene cargar los valores siempre con el mismo formato en el CMS.
   ========================================================================== */

/** Clave de comparación: sin tildes, en minúsculas, espacios colapsados. */
export const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Datos de un producto que usa el script del navegador para filtrar. */
export function cardFilterData(p) {
  const attrs = {};
  for (const a of p.attributes ?? []) {
    if (!a || !clean(a.key) || clean(a.value) === "") continue;
    attrs[norm(a.key)] = norm(a.value); // si la clave se repite, gana la última
  }
  const price = Number(p.price);
  return {
    price: Number.isFinite(price) ? price : 0,
    brand: p.brand ? norm(p.brand) : "",
    inst: Number(p.installments) > 1 ? Number(p.installments) : 0,
    attrs,
  };
}

/** Grupos de filtro disponibles para una lista de productos. */
export function buildFacets(products) {
  // Precio
  const prices = products.map((p) => Number(p.price)).filter((n) => Number.isFinite(n) && n > 0);
  const priceMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;

  // Marcas (solo las que tienen los productos de esta página)
  const brandMap = new Map();
  for (const p of products) {
    if (!clean(p.brand)) continue;
    const k = norm(p.brand);
    const cur = brandMap.get(k) ?? { value: k, label: clean(p.brand), count: 0 };
    cur.count++;
    brandMap.set(k, cur);
  }
  const brands = [...brandMap.values()].sort((a, b) => collator.compare(a.label, b.label));

  // Cuotas: cantidades distintas (>1) que existen en los productos
  const instValues = [...new Set(products.map((p) => (Number(p.installments) > 1 ? Number(p.installments) : 0)))];
  const instOptions = instValues.filter((n) => n > 1).sort((a, b) => a - b);
  const instVaries = instValues.length > 1 && instOptions.length > 0;

  // Atributos clave/valor → grupos específicos
  const specMap = new Map();
  for (const p of products) {
    const seen = new Set();
    for (const a of p.attributes ?? []) {
      if (!a || !clean(a.key) || clean(a.value) === "") continue;
      const k = norm(a.key);
      const v = norm(a.value);
      const g = specMap.get(k) ?? { key: k, label: clean(a.key), products: 0, values: new Map() };
      if (!seen.has(k)) {
        g.products++;
        seen.add(k);
      }
      const val = g.values.get(v) ?? { value: v, label: clean(a.value), count: 0 };
      val.count++;
      g.values.set(v, val);
      specMap.set(k, g);
    }
  }
  const specs = [...specMap.values()]
    // un grupo con un solo valor no sirve para filtrar
    .filter((g) => g.values.size >= 2)
    .map((g) => ({
      key: g.key,
      label: g.label,
      products: g.products,
      values: [...g.values.values()].sort((a, b) => collator.compare(a.label, b.label)),
    }))
    .sort((a, b) => b.products - a.products || collator.compare(a.label, b.label));

  const show = {
    price: priceMax > priceMin,
    brand: brands.length >= 2,
    installments: instVaries,
    specs: specs.length > 0,
  };

  return {
    price: { min: priceMin, max: priceMax },
    brands,
    installments: instOptions,
    specs,
    show,
    any: products.length > 1 && (show.price || show.brand || show.installments || show.specs),
  };
}
