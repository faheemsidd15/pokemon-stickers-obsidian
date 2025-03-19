import preact from "@preact/preset-vite";

export default {
  plugins: [preact()],
  build: {
    outDir: "dist",
    minify: "esbuild",
    sourcemap: false,
    lib: {
      entry: "src/main.ts",
      name: "ObsidianPokemonStickers",
      fileName: () => "main",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["obsidian", "backup/**"],
      output: {
        entryFileNames: "main.js",
      },
    },
  },
  publicDir: "public",
};
