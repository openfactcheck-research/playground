// Run this command to generate base config and vs code settings:
// pnpm dlx @antfu/eslint-config@latest

import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'app',
    vue: true,
    typescript: true,
    formatters: true,
    gitignore: true,

    // Stylistic rules
    stylistic: {
      indent: 2,
      semi: false,
      quotes: 'single',
    },
  },
  {
    // TypeScript rules
    files: ['**/*.{ts,vue}'],
    rules: {
      'ts/no-redeclare': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'antfu/no-top-level-await': ['off'],
      'perfectionist/sort-imports': ['error'],
    },
  },
  {
    // Vue rules
    files: ['**/*.vue'],
    rules: {
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/component-options-name-casing': ['error', 'PascalCase'],
      'vue/prefer-import-from-vue': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
    },
  },
  {
    // Source files
    files: ['**/*.{js,ts,vue}'],
    rules: {
      'no-console': ['warn'],
    },
  },
)
