/// <reference types="vitest" />
import path from "node:path"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: "build-timestamp",
            transformIndexHtml: (html) => {
                return html.replace("%BUILD_TIME%", new Date().toISOString())
            },
        },
        sentryVitePlugin({
            org: "jack-brounstein",
            project: "javascript-react",
        }),
    ],
    build: {
        sourcemap: true,
        outDir: "build/dist",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./vitest.setup.ts",
        css: true, // Possibly remove this for speed, if it turns out I don't have CSS-specific tests
        disableConsoleIntercept: true,
    },
})
