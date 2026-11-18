// Adds the new i18n keys to every locale and verifies key parity.
// Run with: node scripts/sync-locales.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr", "de", "es", "zh-CN"];

const ADDITIONS = {
  "downloadResults.shareTitle": {
    en: "Share {{fileName}}",
    fr: "Partager {{fileName}}",
    de: "{{fileName}} teilen",
    es: "Compartir {{fileName}}",
    "zh-CN": "分享 {{fileName}}",
  },
  "downloadResults.shareCard": {
    en: "Share savings card",
    fr: "Partager la carte d'économies",
    de: "Ersparnis-Karte teilen",
    es: "Compartir tarjeta de ahorro",
    "zh-CN": "分享节省卡片",
  },
  "toast.shareUnsupported": {
    en: "Sharing isn't available in this browser",
    fr: "Le partage n'est pas disponible dans ce navigateur",
    de: "Teilen ist in diesem Browser nicht verfügbar",
    es: "Compartir no está disponible en este navegador",
    "zh-CN": "此浏览器不支持分享",
  },
  "share.cardTagline": {
    en: "100% in-browser · no uploads",
    fr: "100 % dans le navigateur · aucun envoi",
    de: "100 % im Browser · keine Uploads",
    es: "100 % en el navegador · sin subidas",
    "zh-CN": "100% 浏览器内处理 · 不上传",
  },
  "pwa.installed": {
    en: "App installed.",
    fr: "Application installée.",
    de: "App installiert.",
    es: "Aplicación instalada.",
    "zh-CN": "应用已安装。",
  },
  "pwa.installCancelled": {
    en: "Installation was cancelled.",
    fr: "Installation annulée.",
    de: "Installation abgebrochen.",
    es: "Instalación cancelada.",
    "zh-CN": "安装已取消。",
  },
  "pwa.installFailed": {
    en: "Installation couldn't be completed.",
    fr: "L'installation n'a pas pu aboutir.",
    de: "Installation konnte nicht abgeschlossen werden.",
    es: "No se pudo completar la instalación.",
    "zh-CN": "安装未能完成。",
  },
  "footer.linkedin": {
    en: "LinkedIn",
    fr: "LinkedIn",
    de: "LinkedIn",
    es: "LinkedIn",
    "zh-CN": "LinkedIn",
  },
  "footer.portfolio": {
    en: "Portfolio",
    fr: "Portfolio",
    de: "Portfolio",
    es: "Portfolio",
    "zh-CN": "作品集",
  },
  "footer.builtBy": {
    en: "Built by {{name}}",
    fr: "Développé par {{name}}",
    de: "Entwickelt von {{name}}",
    es: "Desarrollado por {{name}}",
    "zh-CN": "开发者 {{name}}",
  },
  "watermark.title": {
    en: "Watermark",
    fr: "Filigrane",
    de: "Wasserzeichen",
    es: "Marca de agua",
    "zh-CN": "水印",
  },
  "watermark.text": {
    en: "Watermark text",
    fr: "Texte du filigrane",
    de: "Wasserzeichen-Text",
    es: "Texto de la marca de agua",
    "zh-CN": "水印文字",
  },
  "watermark.position": {
    en: "Position",
    fr: "Position",
    de: "Position",
    es: "Posición",
    "zh-CN": "位置",
  },
  "watermark.opacity": {
    en: "Opacity (0.1-1)",
    fr: "Opacité (0.1-1)",
    de: "Deckkraft (0.1-1)",
    es: "Opacidad (0.1-1)",
    "zh-CN": "不透明度 (0.1-1)",
  },
  "watermark.positions.topLeft": {
    en: "Top left",
    fr: "En haut à gauche",
    de: "Oben links",
    es: "Arriba a la izquierda",
    "zh-CN": "左上",
  },
  "watermark.positions.topRight": {
    en: "Top right",
    fr: "En haut à droite",
    de: "Oben rechts",
    es: "Arriba a la derecha",
    "zh-CN": "右上",
  },
  "watermark.positions.bottomLeft": {
    en: "Bottom left",
    fr: "En bas à gauche",
    de: "Unten links",
    es: "Abajo a la izquierda",
    "zh-CN": "左下",
  },
  "watermark.positions.bottomRight": {
    en: "Bottom right",
    fr: "En bas à droite",
    de: "Unten rechts",
    es: "Abajo a la derecha",
    "zh-CN": "右下",
  },
  "watermark.positions.center": {
    en: "Center",
    fr: "Centre",
    de: "Mitte",
    es: "Centro",
    "zh-CN": "居中",
  },
};

const setPath = (target, path, value) => {
  const parts = path.split(".");
  const last = parts.pop();
  let cursor = target;
  for (const part of parts) {
    if (typeof cursor[part] !== "object" || cursor[part] === null) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[last] = value;
};

const flattenKeys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flattenKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

for (const locale of LOCALES) {
  const file = resolve(root, `public/locales/${locale}/translation.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));

  for (const [path, values] of Object.entries(ADDITIONS)) {
    const value = values[locale];
    if (typeof value !== "string") throw new Error(`Missing ${locale} value for ${path}`);
    setPath(data, path, value);
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`${locale}: ${flattenKeys(data).length} keys`);
}
