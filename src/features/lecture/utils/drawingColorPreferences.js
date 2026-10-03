import { TOOL_COLORS } from "./lectureData.js";

export const DRAWING_PALETTE_COLORS = [
  "#212326",
  "#EF4444",
  "#2F6BFF",
  "#22C55E",
  "#FACC15",
];

export const MAX_SAVED_DRAWING_COLORS = 5;

const STORAGE_KEY_PREFIX = "tikitaka_drawing_colors_v1";
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeColor(value) {
  return typeof value === "string" && COLOR_PATTERN.test(value)
    ? value.toUpperCase()
    : null;
}

export function getDrawingColorStorageKey() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    const userId = user?.user_id ?? user?.userId ?? user?.id ?? user?.email;
    return userId ? `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}` : null;
  } catch (error) {
    console.warn("필기 색상 설정의 사용자 정보를 읽지 못했습니다.", error);
    return null;
  }
}

export function readDrawingColorPreferences(storageKey) {
  const defaults = {
    colorsByTool: { ...TOOL_COLORS },
    savedColors: [],
  };
  if (!storageKey) return defaults;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!stored || typeof stored !== "object") return defaults;

    const savedColors = Array.isArray(stored.savedColors)
      ? stored.savedColors
        .map(normalizeColor)
        .filter((color) => color && !DRAWING_PALETTE_COLORS.includes(color))
        .filter((color, index, colors) => colors.indexOf(color) === index)
        .slice(-MAX_SAVED_DRAWING_COLORS)
      : [];

    return {
      colorsByTool: {
        PEN: normalizeColor(stored.colorsByTool?.PEN) || TOOL_COLORS.PEN,
        HIGHLIGHTER: normalizeColor(stored.colorsByTool?.HIGHLIGHTER) || TOOL_COLORS.HIGHLIGHTER,
      },
      savedColors,
    };
  } catch (error) {
    console.warn("필기 색상 설정을 불러오지 못했습니다.", error);
    return defaults;
  }
}

export function saveDrawingColorPreferences(storageKey, preferences) {
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.warn("필기 색상 설정을 저장하지 못했습니다.", error);
  }
}

export function addSavedDrawingColor(savedColors, value) {
  const color = normalizeColor(value);
  if (!color || DRAWING_PALETTE_COLORS.includes(color)) return savedColors;

  return [
    ...savedColors.filter((savedColor) => savedColor !== color),
    color,
  ].slice(-MAX_SAVED_DRAWING_COLORS);
}
