/** Per-client presentation for ZFT Overland Travel. No world state is touched. */
import { MODULE_ID } from "../constants/module-constants.js";

export const THEME_SETTING = "interfaceTheme";
export const THEME_FIELDS = Object.freeze([
  ["window", "Window background", "Surfaces", "#1D1713"],
  ["header", "Header background", "Surfaces", "#3A2A1C"],
  ["headerEnd", "Header gradient end", "Surfaces", "#281D16"],
  ["panel", "Panel background", "Surfaces", "#2C241D"],
  ["card", "Result / day cards", "Surfaces", "#2B231C"],
  ["roster", "Party roster", "Surfaces", "#241C17"],
  ["input", "Field backgrounds", "Surfaces", "#191713"],
  ["border", "Borders and dividers", "Surfaces", "#80603C"],
  ["text", "Primary text", "Typography", "#EADAC3"],
  ["muted", "Secondary text", "Typography", "#C3AE93"],
  ["heading", "Expedition heading", "Typography", "#F2D4A0"],
  ["accent", "Gold accent", "Typography", "#DFB36E"],
  ["button", "Buttons", "Controls", "#453324"],
  ["buttonHover", "Button hover", "Controls", "#564029"],
  ["buttonText", "Button text", "Controls", "#F1DFBE"],
  ["track", "Progress track", "Controls", "#433426"],
  ["fill", "Progress fill", "Controls", "#D9B16B"],
  ["navigation", "Navigation result background", "Results", "#2B363D"],
  ["navigationEdge", "Navigation accent border", "Results", "#6D96A6"],
  ["secondary", "Secondary result background", "Results", "#312E32"],
  ["success", "Success indicators", "Results", "#9BCCAB"],
  ["failure", "Failure indicators", "Results", "#E59698"]
].map(([key,label,group,value])=>Object.freeze({key,label,group,value})));
const BASE = Object.freeze(Object.fromEntries(THEME_FIELDS.map(field => [field.key, field.value])));
const define = (label, colors) => Object.freeze({ label, colors: Object.freeze({ ...BASE, ...colors }) });
export const THEME_PRESETS = Object.freeze({
  zantor: define("Zantor Default", {}),
  copper: define("Antique Copper", {
    window:"#201713",header:"#4B3021",headerEnd:"#291A14",panel:"#38251C",card:"#352219",roster:"#2C1F19",
    input:"#201714",border:"#AA7851",text:"#F3E2CF",muted:"#D2B79D",heading:"#F6D2A1",accent:"#EBC083",
    button:"#62402B",buttonHover:"#765038",buttonText:"#FBE6CF",track:"#503325",fill:"#DBA36A",
    navigation:"#483027",navigationEdge:"#C48C5B",secondary:"#402D32",success:"#A6D2AA",failure:"#E9A1A0"
  }),
  slate: define("Moonlit Slate", {
    window:"#181E27",header:"#2F3A4A",headerEnd:"#1C2531",panel:"#26313E",card:"#293543",roster:"#222D3B",
    input:"#151E29",border:"#60778A",text:"#E7EAF0",muted:"#BCC7D2",heading:"#E9D6B2",accent:"#DDBA7C",
    button:"#364B5E",buttonHover:"#47647A",buttonText:"#E9EFF5",track:"#25384B",fill:"#80ACC0",
    navigation:"#30495B",navigationEdge:"#79B4CB",secondary:"#3C394F",success:"#9BD8BC",failure:"#EDACB3"
  }),
  verdigris: define("Verdigris", {
    window:"#14231F",header:"#2A4037",headerEnd:"#182921",panel:"#263831",card:"#293D35",roster:"#21352C",
    input:"#14241D",border:"#688F77",text:"#E5E7D4",muted:"#C0CBB7",heading:"#F0D8A1",accent:"#D9BD82",
    button:"#365344",buttonHover:"#47705C",buttonText:"#ECF0D9",track:"#254537",fill:"#9FC09B",
    navigation:"#29483D",navigationEdge:"#7AAE9E",secondary:"#3B3C45",success:"#B0E2BA",failure:"#EDABA7"
  }),
  graphite: define("Graphite", {
    window:"#191A1C",header:"#303134",headerEnd:"#222325",panel:"#292A2D",card:"#303135",roster:"#232428",
    input:"#18191C",border:"#777579",text:"#EEEEEA",muted:"#C1C0BA",heading:"#F1E2C4",accent:"#D2B88B",
    button:"#3E3E41",buttonHover:"#55545A",buttonText:"#F3EFE7",track:"#38383D",fill:"#BBA27A",
    navigation:"#34383E",navigationEdge:"#9899A0",secondary:"#36333C",success:"#A7D8BC",failure:"#E0A3A6"
  })
});
const HEX = /^#[0-9a-fA-F]{6}$/;
export const validHex = input => typeof input === "string" && HEX.test(input.trim());
export const cleanTheme = input => {
  const preset = Object.hasOwn(THEME_PRESETS, input?.preset) ? input.preset : "zantor";
  const overrides = {};
  for (const field of THEME_FIELDS) {
    const value = input?.overrides?.[field.key];
    if (validHex(value)) overrides[field.key] = value.trim().toUpperCase();
  }
  return { preset, overrides };
};
export const themeColors = theme => {
  const safe = cleanTheme(theme);
  return { ...THEME_PRESETS[safe.preset].colors, ...safe.overrides };
};
export const hasCustomTheme = theme => {
  const safe = cleanTheme(theme);
  return safe.preset !== "zantor" || Object.keys(safe.overrides).length > 0;
};
const LEGACY_TOKEN_MAP = Object.freeze({
  "--zft-hex-amber":"accent", "--zft-hex-green":"success", "--zft-hex-red":"failure", "--zft-hex-text":"text",
  "--zft-hex-muted":"muted", "--zft-hex-bg":"window", "--zft-hex-panel":"panel",
  "--zft-hex-border":"border", "--zft-hex-parchment":"heading", "--zft-hex-copper":"border"
});
export class ThemeManager {
  static register() {
    game.settings.register(MODULE_ID, THEME_SETTING, {
      name: "Interface Theme", hint: "Personal ZFT Overland Travel colors.",
      scope: "client", config: false, type: Object,
      default: { preset: "zantor", overrides: {} },
      onChange: value => this.apply(value)
    });
  }
  static saved() { return cleanTheme(game.settings.get(MODULE_ID, THEME_SETTING)); }
  static apply(theme = this.saved()) {
    const safe = cleanTheme(theme);
    const active = hasCustomTheme(safe);
    const colors = themeColors(safe);
    for (const id of ["zft-hex-travel-console", "zft-hex-travel-log", "zft-hex-travel-workflow-window", "zft-overland-theme-window", "zft-hex-scale-window"]) {
      const node = document.getElementById(id);
      if (!node) continue;
      if (!active) {
        delete node.dataset.zftThemeActive;
        for (const field of THEME_FIELDS) node.style.removeProperty(`--zft-theme-${field.key}`);
        for (const prop of Object.keys(LEGACY_TOKEN_MAP)) node.style.removeProperty(prop);
      } else {
        node.dataset.zftThemeActive = "true";
        for (const field of THEME_FIELDS) node.style.setProperty(`--zft-theme-${field.key}`, colors[field.key]);
        for (const [prop,key] of Object.entries(LEGACY_TOKEN_MAP)) node.style.setProperty(prop,colors[key]);
      }
    }
  }
  static async save(theme) { await game.settings.set(MODULE_ID, THEME_SETTING, cleanTheme(theme)); }
}
