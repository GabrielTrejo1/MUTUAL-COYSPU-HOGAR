/* Promociones del hero (bloque 3). Se muestra la primera activa y vigente, por orden.
   Guardar como: schemaTypes/promocion.js */
   import { defineField, defineType } from "sanity";
   import { campoModo, requeridoEn, soloEn, validarEnlace } from "./_helpers";
   
   export default defineType({
     name: "promocion",
     title: "Promoción",
     type: "document",
     groups: [
       { name: "contenido", title: "Contenido", default: true },
       { name: "enlace", title: "Botón y enlace" },
       { name: "publicacion", title: "Publicación" },
     ],
     fields: [
       defineField({
         name: "nombre",
         title: "Nombre interno",
         type: "string",
         description: 'Solo para reconocerla en el panel. Ej.: "Hot Sale octubre".',
         group: "contenido",
         validation: (Rule) => Rule.required(),
       }),
       { ...campoModo, group: "contenido" },
   
       /* ----- Modo "Con texto" ----- */
       defineField({
         name: "etiqueta",
         title: "Etiqueta",
         type: "string",
         description: 'Chapita arriba del título. Ej.: "Hasta 30% OFF" o "Temporada".',
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) => Rule.max(30).warning("Conviene que sea corta (hasta 30 caracteres)."),
       }),
       defineField({
         name: "titulo",
         title: "Título",
         type: "string",
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) =>
           Rule.max(50).warning("Conviene que sea corto (hasta 50 caracteres).").custom((v, c) =>
             (c.document?.modo ?? "contenido") !== "contenido" || v ? true : "Falta el título"
           ),
       }),
       defineField({
         name: "texto",
         title: "Texto",
         type: "text",
         rows: 2,
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) => Rule.max(120).warning("Conviene que sea corto (hasta 120 caracteres)."),
       }),
       defineField({
         name: "imagen",
         title: "Imagen de fondo",
         type: "image",
         options: { hotspot: true },
         description: "Opcional. Si no la cargás, se usa el color del tema.",
         group: "contenido",
         hidden: soloEn("contenido"),
       }),
       defineField({
         name: "tema",
         title: "Color",
         type: "string",
         options: {
           list: [
             { title: "Verde", value: "leaf" },
             { title: "Marrón", value: "brown" },
             { title: "Arena", value: "sand" },
             { title: "Turquesa", value: "teal" },
           ],
           layout: "radio",
         },
         initialValue: "leaf",
         group: "contenido",
         hidden: soloEn("contenido"),
       }),
   
       /* ----- Modo "Solo imagen" ----- */
       defineField({
         name: "bannerImagen",
         title: "Imagen del banner",
         type: "image",
         options: { hotspot: true },
         description: "Vertical 4:5, como una publicación de Instagram: 1080 × 1350 px. Con otra proporción se recorta un poco, así que dejá lo importante en el centro.",
         group: "contenido",
         hidden: soloEn("banner"),
         validation: requeridoEn("banner", "Subí la imagen del banner"),
       }),
       defineField({
         name: "bannerImagenMobile",
         title: "Imagen del banner para celular (opcional)",
         type: "image",
         options: { hotspot: true },
         description: "Opcional. Si no la cargás, se usa la imagen principal (1080 × 1350).",
         group: "contenido",
         hidden: soloEn("banner"),
       }),
       defineField({
         name: "bannerAlt",
         title: "Texto alternativo del banner",
         type: "string",
         description: "Obligatorio. Si la imagen tiene texto, repetilo acá: lo leen los lectores de pantalla.",
         group: "contenido",
         hidden: soloEn("banner"),
         validation: requeridoEn("banner", "Describí la imagen (incluí el texto que tenga)"),
       }),
   
       /* ----- Enlace ----- */
       defineField({
         name: "categoria",
         title: "Categoría relacionada",
         type: "reference",
         to: [{ type: "category" }],
         description: "Opcional. Si no escribís un enlace, el botón lleva a esta categoría y toma su ícono.",
         group: "enlace",
       }),
       defineField({
         name: "enlace",
         title: "Enlace",
         type: "string",
         description:
           'Opcional; tiene prioridad sobre la categoría. Ruta interna ("/ofertas") o https://… Si no hay enlace ni categoría, lleva a /ofertas.',
         group: "enlace",
         validation: validarEnlace,
       }),
       defineField({
         name: "botonTexto",
         title: "Texto del botón",
         type: "string",
         initialValue: "Ver promoción",
         description: 'Solo se usa en el modo "Con texto".',
         group: "enlace",
         hidden: soloEn("contenido"),
       }),
   
       /* ----- Publicación ----- */
       defineField({
         name: "activa",
         title: "Activa",
         type: "boolean",
         initialValue: true,
         description: "Desmarcala para ocultar la promoción sin borrarla.",
         group: "publicacion",
       }),
       defineField({
         name: "orden",
         title: "Orden",
         type: "number",
         initialValue: 1,
         description: "Número más bajo = más prioridad. Se muestra la primera activa y vigente.",
         group: "publicacion",
         validation: (Rule) => Rule.integer().min(0),
       }),
       defineField({
         name: "desde",
         title: "Vigente desde",
         type: "datetime",
         description: "Opcional.",
         group: "publicacion",
       }),
       defineField({
         name: "hasta",
         title: "Vigente hasta",
         type: "datetime",
         description: "Opcional. Pasada esta fecha la promoción deja de mostrarse (cuando el sitio se vuelve a publicar).",
         group: "publicacion",
         validation: (Rule) =>
           Rule.custom((hasta, ctx) =>
             !hasta || !ctx.document?.desde || new Date(hasta) >= new Date(ctx.document.desde)
               ? true
               : '"Hasta" no puede ser anterior a "Desde"'
           ),
       }),
     ],
     orderings: [
       { title: "Orden de aparición", name: "orden", by: [{ field: "orden", direction: "asc" }] },
     ],
     preview: {
       select: { nombre: "nombre", modo: "modo", activa: "activa", hasta: "hasta", media: "imagen", banner: "bannerImagen" },
       prepare: ({ nombre, modo, activa, hasta, media, banner }) => ({
         title: nombre,
         subtitle: [
           activa === false ? "Inactiva" : "Activa",
           modo === "banner" ? "Banner" : "Con texto",
           hasta ? `hasta ${new Date(hasta).toLocaleDateString("es-AR")}` : null,
         ]
           .filter(Boolean)
           .join(" · "),
         media: modo === "banner" ? banner : media,
       }),
     },
   });