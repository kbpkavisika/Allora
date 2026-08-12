const { Colors, Fonts } = require("./constants/theme.ts");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: Colors.light,
      fontFamily: {
        archivo: Fonts.archivo.regular,
        "archivo-medium": Fonts.archivo.medium,
        "archivo-semibold": Fonts.archivo.semiBold,
        "archivo-bold": Fonts.archivo.bold,
        "archivo-extrabold": Fonts.archivo.extraBold,
        mono: Fonts.ibmPlexMono.regular,
        "mono-medium": Fonts.ibmPlexMono.medium,
      },
    },
  },
  plugins: [],
}
