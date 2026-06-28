import { createWorker, PSM } from "tesseract.js";

export const FEATURE_ORDER = [
  "mean radius", "mean texture", "mean perimeter", "mean area", "mean smoothness",
  "mean compactness", "mean concavity", "mean concave points", "mean symmetry", "mean fractal dimension",
  "radius error", "texture error", "perimeter error", "area error", "smoothness error",
  "compactness error", "concavity error", "concave points error", "symmetry error", "fractal dimension error",
  "worst radius", "worst texture", "worst perimeter", "worst area", "worst smoothness",
  "worst compactness", "worst concavity", "worst concave points", "worst symmetry", "worst fractal dimension"
];

function normalizeText(text) {
  return text.toLowerCase().replace(/[—–]/g, "-").replace(/\r?\n/g, " ").replace(/[^a-z0-9.,:=+\- ]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFeaturePattern(feature) {
  const label = escapeRegExp(feature).replace(/ /g, "\\s+");
  return new RegExp(`${label}\\s*[:=\\-]?\\s*([-+]?(?:\\d+(?:[.,]\\d+)?|\\.\\d+))`, "i");
}

export function parseWdbcFeatures(ocrText) {
  const normalizedText = normalizeText(ocrText);
  const features = {};

  FEATURE_ORDER.forEach((feature) => {
    const match = normalizedText.match(buildFeaturePattern(feature));
    if (!match) return;
    const value = Number(match[1].replace(",", "."));
    if (Number.isFinite(value)) {
      features[feature] = value;
    }
  });

  const missingFeatures = FEATURE_ORDER.filter((feature) => features[feature] === undefined);
  return {
    features,
    missingFeatures,
    allFeaturesDetected: missingFeatures.length === 0,
    orderedFeatures: missingFeatures.length === 0 ? FEATURE_ORDER.map((feature) => features[feature]) : []
  };
}

export async function extractFeaturesFromImage(file, onProgress) {
  if (!file?.type?.startsWith("image/")) throw new Error("Please upload a PNG, JPG, or JPEG image.");
  
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof onProgress === "function") {
        onProgress(Math.round(message.progress * 100));
      }
    }
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data: { text } } = await worker.recognize(file);
    return { rawText: text, ...parseWdbcFeatures(text) };
  } finally {
    await worker.terminate();
  }
}
