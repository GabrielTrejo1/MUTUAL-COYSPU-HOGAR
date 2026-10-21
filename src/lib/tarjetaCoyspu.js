/* Bloque "Tarjeta Coyspu" del hero. Documento ÚNICO (singleton).
   Guardar como: schemaTypes/tarjetaCoyspu.js */
   import { defineField, defineType } from "sanity";
   import { campoModo, requeridoEn, soloEn, validarEnlace } from "./_helpers";
   
   export default defineType({
     name: "tarjetaCoyspu",
     title: "Tarjeta Coyspu",
     type: "document",
     description: "Bloque de la tarjeta en el inicio. Creá UN solo documento y editá siempre ese: el sitio usa el que se modificó más recientemente.",
     groups: [
       { name: "contenido", title: "Contenido", default: true },
       { name: "enlace", title: "Botón y enlace" },
     ],
     fields: [
       { ...campoModo, group: "contenido" },
   
       /* ----- Modo "Con texto" ----- */
       defineField({
         name: "titulo",
         title: "Título",
         type: "string",
         description: 'Encabezado del bloque. Ej.: "Tarjeta Coyspu" o "Sacá tu Tarjeta Coyspu".',
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) =>
           Rule.max(40).warning("Conviene que sea corto (hasta 40 caracteres).").custom((v, c) =>
             (c.document?.modo ?? "contenido") !== "contenido" || v ? true : "Falta el título"
           ),
       }),
       defineField({
         name: "leyenda",
         title: "Leyenda destacada",
         type: "string",
         description: 'La frase que más tiene que llamar la atención. Ej.: "10 o más cuotas sin interés".',
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) => Rule.max(60).warning("Conviene que sea corta (hasta 60 caracteres)."),
       }),
       defineField({
         name: "texto",
         title: "Texto",
         type: "text",
         rows: 2,
         description: "Una o dos líneas. Opcional.",
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) => Rule.max(140).warning("Conviene que sea corto (hasta 140 caracteres)."),
       }),
       defineField({
         name: "beneficios",
         title: "Beneficios",
         type: "array",
         of: [{ type: "string", validation: (Rule) => Rule.max(40).warning("Mejor hasta 40 caracteres.") }],
         description: "Hasta 3, frases cortas. En el celular se ocultan para que el bloque quede compacto.",
         group: "contenido",
         hidden: soloEn("contenido"),
         validation: (Rule) => Rule.max(3).error("Máximo 3 beneficios."),
       }),
       defineField({
         name: "imagen",
         title: "Imagen de la tarjeta",
         type: "image",
         options: { hotspot: true },
         description: "Foto o render de la tarjeta. Mejor con fondo transparente (PNG) o fondo liso.",
         group: "contenido",
         hidden: soloEn("contenido"),
         fields: [{ name: "alt", title: "Texto alternativo", type: "string", description: "Qué se ve en la imagen." }],
       }),
   
       /* ----- Modo "Solo imagen" ----- */
       defineField({
         name: "bannerImagen",
         title: "Imagen del banner",
         type: "image",
         options: { hotspot: true },
         description: "Apaisada, proporción 2:1 (recomendado 1200 × 600 px). Es la imagen completa del bloque; lo que sobre se recorta, así que dejá el texto importante en el centro.",
         group: "contenido",
         hidden: soloEn("banner"),
         validation: requeridoEn("banner", "Subí la imagen del banner"),
       }),
       defineField({
         name: "bannerImagenMobile",
         title: "Imagen del banner para celular (opcional)",
         type: "image",
         options: { hotspot: true },
         description: "Opcional. Si no la cargás, se usa la imagen principal recortada (2:1).",
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
   
       /* ----- Común a los dos modos ----- */
       defineField({
         name: "botonTexto",
         title: "Texto del botón",
         type: "string",
         initialValue: "Quiero mi tarjeta",
         description: 'Solo se usa en el modo "Con texto".',
         group: "enlace",
         hidden: soloEn("contenido"),
       }),
       defineField({
         name: "enlace",
         title: "Enlace",
         type: "string",
         description:
           'A dónde lleva el botón (o todo el banner). Ruta interna ("/contacto") o https://… Si lo dejás vacío se abre WhatsApp con un mensaje ya escrito.',
         group: "enlace",
         validation: validarEnlace,
       }),
       defineField({
         name: "mensajeWhatsApp",
         title: "Mensaje de WhatsApp",
         type: "string",
         initialValue: "Hola, quiero sacar la Tarjeta Coyspu",
         description: "Se usa solo si el enlace está vacío.",
         group: "enlace",
       }),
     ],
     preview: {
       select: { titulo: "titulo", modo: "modo", media: "imagen", banner: "bannerImagen" },
       prepare: ({ titulo, modo, media, banner }) => ({
         title: "Tarjeta Coyspu",
         subtitle: modo === "banner" ? "Solo imagen (banner)" : titulo || "Con texto",
         media: modo === "banner" ? banner : media,
       }),
     },
   });