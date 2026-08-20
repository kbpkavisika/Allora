const plugin = require("tailwindcss/plugin");
const {
  Colors,
  Fonts,
  typographySpecs,
  Spacing,
  Radius,
  BorderWidth,
  ControlSize,
} = require("./constants/theme.ts");

const colors = Object.fromEntries(
  Object.keys(Colors.light).map((token) => [
    token,
    `rgb(var(--color-${token}) / <alpha-value>)`,
  ])
);

const px = (n) => `${n}px`;
const toPx = (scale) => Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, px(v)]));

const spacing = toPx(Spacing);
const borderRadius = toPx(Radius);
const borderWidth = toPx(BorderWidth);

const controlHeight = {
  "control-lg": px(ControlSize.lg),
  "control-md": px(ControlSize.md),
  "control-sm": px(ControlSize.sm),
  tap: px(ControlSize.tap),
  glyph: px(ControlSize.glyph),
};

const typography = plugin(function ({ addComponents }) {
  const components = {};
  for (const [token, spec] of Object.entries(typographySpecs)) {
    components[`.type-${token}`] = {
      fontFamily: spec.fontFamily,
      fontSize: `${spec.fontSize}px`,
      lineHeight: `${spec.lineHeight}px`,
      letterSpacing: `${spec.letterSpacing ?? 0}px`,
      ...(spec.textTransform ? { textTransform: spec.textTransform } : null),
    };
  }
  addComponents(components);
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    spacing,
    borderRadius,
    borderWidth,
    extend: {
      colors,
      fontFamily: {
        archivo: Fonts.archivo.regular,
        "archivo-medium": Fonts.archivo.medium,
        "archivo-semibold": Fonts.archivo.semiBold,
        "archivo-bold": Fonts.archivo.bold,
        "archivo-extrabold": Fonts.archivo.extraBold,
        mono: Fonts.ibmPlexMono.regular,
        "mono-medium": Fonts.ibmPlexMono.medium,
      },
      height: controlHeight,
      minHeight: controlHeight,
      width: { tap: px(ControlSize.tap), glyph: px(ControlSize.glyph) },
      minWidth: { tap: px(ControlSize.tap) },
    },
  },
  plugins: [typography],
};
