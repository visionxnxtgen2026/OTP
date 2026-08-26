import { defineConfig } from 'tsup'

export default defineConfig([
  // --- Root barrel (re-exports server + react) ---
  {
    entry: { index: 'src/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'chalk', 'fs', 'path', 'child_process'],
    esbuildOptions(options) { options.jsx = 'automatic' },
  },

  // --- Server entry ---
  {
    entry: { 'server/index': 'src/server/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    external: ['chalk', 'fs', 'path', 'child_process'],
  },

  // --- React entry ---
  {
    entry: { 'react/index': 'src/react/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'chalk', 'fs', 'path'],
    esbuildOptions(options) { options.jsx = 'automatic' },
  },

  // --- Postinstall scaffolding script (CJS only — runs in Node at install time) ---
  {
    entry: { postinstall: 'src/postinstall.ts' },
    outDir: 'dist',
    format: ['cjs'],
    dts: false,
    sourcemap: false,
    clean: false,
    splitting: false,
    treeshake: true,
    // Bundle chalk into postinstall so it works at install time (no hoisting guarantee)
    noExternal: ['chalk'],
    external: ['react', 'react-dom', 'react/jsx-runtime', 'fs', 'path', 'child_process', 'os'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
