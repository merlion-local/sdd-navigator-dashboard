// eslint.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const config = [
  // игнорим мусор
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/dist/**", "**/coverage/**","next-env.d.ts"]
  },

  // подтягиваем next правила (как раньше через extends)
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;