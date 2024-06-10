import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import magicalSvg from "vite-plugin-magical-svg";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    magicalSvg({
      target: "react",
    }),
  ],
  test: {
    pool: "forks",
    includeSource: ["src/**/*.{js,ts,jsx,tsx}"],
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      "**/node_modules/**",
      "**/.{config.mjs,config.ts}/**",
      "src/lib/*",
      "src/components/ui/*",
      "./next.config.mjs",
    ],
  },
});
