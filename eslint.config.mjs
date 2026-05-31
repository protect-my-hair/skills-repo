import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".chrome-qa*/**", "chrome-qa.*.log", "qa-*.png"] },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
