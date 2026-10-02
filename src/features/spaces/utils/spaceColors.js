const SPACE_COLORS = {
  COLOR_1: { background: "#EAF0FF", accent: "#2E63E9" },
  COLOR_2: { background: "#E8F4FF", accent: "#2776C8" },
  COLOR_3: { background: "#E4F7F8", accent: "#168A93" },
  COLOR_4: { background: "#E5F6F1", accent: "#23856E" },
  COLOR_5: { background: "#EAF7ED", accent: "#3F9653" },
  COLOR_6: { background: "#F1F7E4", accent: "#6F8F2E" },
  COLOR_7: { background: "#FFF6D9", accent: "#A57916" },
  COLOR_8: { background: "#FFF0E2", accent: "#C66A22" },
  COLOR_9: { background: "#FDE8E8", accent: "#D54A4A" },
  COLOR_10: { background: "#FBE8F4", accent: "#C64D91" },
  COLOR_11: { background: "#F1EAFE", accent: "#7B57C7" },
  COLOR_12: { background: "#ECECFF", accent: "#5B5CC5" },
};

export function getSpaceColor(colorKey) {
  return SPACE_COLORS[colorKey] ?? SPACE_COLORS.COLOR_1;
}
