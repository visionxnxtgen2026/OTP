import { defineConfig } from 'tsup'

export default defineConfig([
  // --- Server entry (no JSX, no React) ---
  {
    entry: { 'server/index': 'src/server/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    // react is not used on server; no externals needed
    external: [],
  },

  // --- React entry (JSX, peer react) ---
  {
    entry: { 'react/index': 'src/react/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    // Do NOT bundle react — use the host app's copy
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },

  // --- Root barrel (re-exports server + react) ---
  {
    entry: { index: 'src/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
])
