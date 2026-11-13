// ESLint for the whole project: TypeScript's recommended rules and the two React Hooks rules.
// Run from the project's root (npm run lint), which is the base for the paths below.
//
// This folder is its own package because the TypeScript parser needs the compiler's JavaScript API,
// and the site's own TypeScript (7, the native compiler) does not ship one.
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "**/node_modules/**"] },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // useScrollFrame takes a dependency list like an effect: check it the same way.
      "react-hooks/exhaustive-deps": ["error", { additionalHooks: "useScrollFrame" }],
    },
  },
);
