import stylistic from "@stylistic/eslint-plugin";
import type { Rule } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const LOWERCASE_ID = { regex: "Id($|[A-Z0-9_])", match: false };

const noComments: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        schema: [],
        messages: { comment: "Comments are not allowed. Make the code say it." },
    },
    create(context)
    {
        return {
            Program()
            {
                for (const comment of context.sourceCode.getAllComments())
                {
                    if ((comment.type as string) !== "Shebang" && comment.loc)
                    {
                        context.report({ loc: comment.loc, messageId: "comment" });
                    }
                }
            },
        };
    },
};

export default defineConfig(
    globalIgnores(["**/.build/", "convex/_generated/"]),
    tseslint.configs.strict,
    stylistic.configs.customize({ indent: 4, quotes: "double", semi: true, braceStyle: "allman" }),
    {
        languageOptions: { globals: { ...globals.node } },
        plugins: { hara: { rules: { "no-comments": noComments } } },
        linterOptions: { reportUnusedDisableDirectives: "error" },
        rules: {
            "hara/no-comments": "error",
            "curly": ["error", "all"],
            "eqeqeq": ["error", "always"],
            "no-console": "off",
            "@stylistic/max-len": ["error", { code: 150, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
            "@typescript-eslint/naming-convention": [
                "error",
                { selector: "default", format: ["camelCase"], custom: LOWERCASE_ID },
                { selector: "import", format: null },
                { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow", custom: LOWERCASE_ID },
                { selector: "variable", modifiers: ["const"], format: ["camelCase", "UPPER_CASE", "PascalCase"], custom: LOWERCASE_ID },
                { selector: "function", format: ["camelCase", "PascalCase"], custom: LOWERCASE_ID },
                { selector: "typeLike", format: ["PascalCase"], custom: LOWERCASE_ID },
                { selector: "interface", format: ["PascalCase"], prefix: ["I"], custom: LOWERCASE_ID },
                { selector: "typeParameter", format: ["PascalCase"], prefix: ["T"] },
                { selector: "enumMember", format: ["PascalCase"] },
                { selector: ["objectLiteralProperty", "objectLiteralMethod", "typeProperty"], format: null, custom: LOWERCASE_ID },
                { selector: "objectLiteralProperty", filter: { regex: "^(messageId|userId)$", match: true }, format: null },
            ],
        },
    },
    {
        files: ["apps/console/src/renderer/**", "apps/web/src/**"],
        extends: [reactHooks.configs.flat.recommended],
        languageOptions: { globals: { ...globals.browser } },
    },
);
