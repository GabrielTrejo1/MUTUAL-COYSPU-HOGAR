/* ==========================================================================
   Capa de datos — Sanity (JavaScript)
   Adaptada a los schemas: category, product, brand, color.

   Variables de entorno (.env):
     PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
     PUBLIC_SANITY_DATASET=production
   Dependencia:  npm i @sanity/client

   Convenciones de esta capa:
   - Los campos en español del CMS se exponen con nombres en inglés al resto
     del sitio (nombre → name / title, precio → price, etc.), así los
     componentes no dependen del idioma del esquema.
   - Precio: `precio` es el precio regular y `precioOferta` el de promoción.
     Si hay oferta válida (menor al regular): price = oferta y oldPrice = regular.
     Si no: price = regular y oldPrice = null.
   - Categorías con jerarquía: un "departamento" no tiene categoriaPadre; sus
     subcategorías sí. Un producto que pertenece a una subcategoría también
     cuenta como parte de su departamento (se asume un solo nivel de padre).
   ========================================================================== */
import { createClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? "production";

if (!projectId) {
  throw new Error(
    "Falta PUBLIC_SANITY_PROJECT_ID en el archivo .env (ver src/lib/sanity.js)."
  );
}

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: import.meta.env.PROD,
});

/* ---------- Presentación por categoría ----------
   Ícono (id del sprite en Layout.astro) y tono de fondo (clase .tone-* de
   catalog.css) según el slug del DEPARTAMENTO. Reemplazá las claves por los
   slugs reales de tus departamentos; los que no estén usan el valor por defecto. */
const CATEGORY_META = {
  bicicletas: { icon: "i-bike", tone: "tone-bicicletas" },
  electrodomesticos: { icon: "i-washer", tone: "tone-electro" },
  muebles: { icon: "i-sofa", tone: "tone-muebles" },
  "tv-audio-video": { icon: "i-tv", tone: "tone-tv" },
  tecnologia: { icon: "i-tv", tone: "tone-tv" },
  "cocina-y-bazar": { icon: "i-pot", tone: "tone-muebles" },
  climatizacion: { icon: "i-wind", tone: "tone-electro" },
};

export function categoryMeta(slug) {
  return (slug && CATEGORY_META[slug]) || { icon: "i-pot", tone: "tone-muebles" };
}

/* ---------- Fragmentos GROQ reutilizables ---------- */

// Condición: el producto pertenece a la categoría $slug o a una subcategoría suya
const IN_CATEGORY = `(categoria->slug.current == $slug || categoria->categoriaPadre->slug.current == $slug)`;

// Igual, pero relativo a un documento category externo (^) dentro de una proyección
const IN_PARENT_CATEGORY = `(categoria._ref == ^._id || categoria->categoriaPadre._ref == ^._id)`;

const PRODUCT_FIELDS = /* groq */ `
  "id": _id,
  "slug": slug.current,
  "name": nombre,
  "code": sku,
  "brand": marca->nombre,
  "badge": select(nuevo == true => "Nuevo"),
  "oldPrice": select(defined(precioOferta) && precioOferta < precio => precio),
  "price": select(defined(precioOferta) && precioOferta < precio => precioOferta, precio),
  "installments": coalesce(cuotas, 0),
  "description": descripcion,
  "features": caracteristicas,
  "attributes": atributos[]{ "key": clave, "value": valor },
  "warranty": garantia,
  "colors": colores[]->{ "name": nombre, "hex": valorHex },
  "image": imagenes[0].asset->url,
  "images": imagenes[].asset->url,
  "category": categoria->{ "slug": slug.current, "title": nombre, "parentSlug": categoriaPadre->slug.current }
`;

const CATEGORY_FIELDS = /* groq */ `
  "slug": slug.current,
  "title": nombre,
  "parentSlug": categoriaPadre->slug.current,
  "count": count(*[_type == "product" && ${IN_PARENT_CATEGORY}])
`;

/* ---------- Productos ---------- */

/** Productos con la etiqueta "Nuevo ingreso" (campo `nuevo`). */
export function getNewProducts(limit = 8) {
  return sanity.fetch(
    `*[_type == "product" && nuevo == true] | order(_createdAt desc)[0...$limit]{ ${PRODUCT_FIELDS} }`,
    { limit }
  );
}

/** Más vendidos. Requiere agregar el campo booleano `masVendido` al schema de producto
    (hasta entonces devuelve [] y la sección no se muestra). */
export function getBestSellers(limit = 8) {
  return sanity.fetch(
    `*[_type == "product" && destacado == true] | order(_updatedAt desc)[0...$limit]{ ${PRODUCT_FIELDS} }`,
    { limit }
  );
}

/** Productos de una categoría o de sus subcategorías. */
export function getProductsByCategory(slug) {
  return sanity.fetch(
    `*[_type == "product" && ${IN_CATEGORY}] | order(nombre asc){ ${PRODUCT_FIELDS} }`,
    { slug }
  );
}

/** Un bloque por cada departamento que tenga al menos un producto:
    [{ slug, title, products: [...] }]
    Trae hasta `limit` productos por departamento (incluye los de sus subcategorías).
    Los marcados como "Mostrar en Destacados" van primero; si hay menos que `limit`,
    el bloque se completa con los demás, así no depende de que haya muchos destacados. */
export function getFeaturedGroups(limit = 4) {
  return sanity.fetch(
    `*[_type == "category" && !defined(categoriaPadre)] | order(nombre asc){
       "slug": slug.current,
       "title": nombre,
       "products": *[_type == "product" && ${IN_PARENT_CATEGORY}]
                    | order(coalesce(destacado, false) desc, _updatedAt desc)[0...$limit]{ ${PRODUCT_FIELDS} }
     }[count(products) > 0]`,
    { limit }
  );
}

/* ---------- Categorías ---------- */

/** Departamentos (sin categoría padre): para la grilla "Nuestras categorías". */
export function getDepartments() {
  return sanity.fetch(
    `*[_type == "category" && !defined(categoriaPadre)] | order(nombre asc){ ${CATEGORY_FIELDS} }`
  );
}

/** Subcategorías directas de una categoría. */
export function getSubcategories(slug) {
  return sanity.fetch(
    `*[_type == "category" && categoriaPadre->slug.current == $slug] | order(nombre asc){ ${CATEGORY_FIELDS} }`,
    { slug }
  );
}

/** Todas las categorías (para generar una página por cada una). */
export function getAllCategories() {
  return sanity.fetch(
    `*[_type == "category" && defined(slug.current)] | order(nombre asc){
       "slug": slug.current,
       "title": nombre,
       "parent": categoriaPadre->{ "slug": slug.current, "title": nombre }
     }`
  );
}

/* ---------- Marcas ---------- */

export function getBrands() {
  return sanity.fetch(
    `*[_type == "brand" && defined(nombre)] | order(nombre asc){ "name": nombre, "logo": logo.asset->url }`
  );
}