#biru-admin

## Next.js

```bash
# https://nextjs.org/docs/app/getting-started/installation
npx create-next-app@latest

✔ What is your project named? … biru-admin
✔ Would you like to use TypeScript? … No / Yes
✔ Would you like to use ESLint? … No / Yes
✔ Would you like to use Tailwind CSS? … No / Yes
✔ Would you like your code inside a `src/` directory? … No / Yes
✔ Would you like to use App Router? (recommended) … No / Yes
✔ Would you like to use Turbopack for `next dev`? … No / Yes
✔ Would you like to customize the import alias (`@/*` by default)? … No / Yes
Creating a new Next.js app in /Users/xuyuanshi/Desktop/biru-admin.

Using npm.

Initializing project with template: app-tw


Installing dependencies:
- react
- react-dom
- next

Installing devDependencies:
- typescript
- @types/node
- @types/react
- @types/react-dom
- @tailwindcss/postcss
- tailwindcss
- eslint
- eslint-config-next
- @eslint/eslintrc
```

## Prettier

```bash
# https://prettier.io/docs/install
pnpm add --save-dev --save-exact prettier
node --eval "fs.writeFileSync('.prettierrc','{}\n')"
node --eval "fs.writeFileSync('.prettierignore','# Ignore artifacts:\nbuild\ncoverage\n')"
pnpm exec prettier . --write
npx prettier . --check

# https://prettier.io/docs/configuration
# https://json.schemastore.org/prettierrc

# .prettierrc
{}
```

## Editor

```bash
# Visual Studio Code
# https://github.com/prettier/prettier-vscode
# https://marketplace.visualstudio.com/items?itemName=tombonnike.vscode-status-bar-format-toggle

# .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always",
    "source.addMissingImports": "always",
    "source.organizeImports": "always"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

## eslint

```bash
# https://nextjs.org/docs/app/api-reference/config/eslint
pnpm add --save-dev eslint-config-prettier

# eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'prettier'],
  }),
]

export default eslintConfig
```

## Git hooks

```bash
# https://prettier.io/docs/install#git-hooks
pnpm add --save-dev husky lint-staged
pnpm exec husky init
node --eval "fs.writeFileSync('.husky/pre-commit','pnpm exec lint-staged\n')"

{
  "lint-staged": {
    "**/*": "prettier --write --ignore-unknown"
  }
}

# https://nextjs.org/docs/app/api-reference/config/eslint
# .lintstagedrc.js
const path = require('path')

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
}

# eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    files: ['.lintstagedrc.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
```

## Material UI

```bash
# https://mui.com/material-ui/getting-started/installation/
pnpm add @mui/material @emotion/react @emotion/styled
pnpm add @mui/icons-material

# https://mui.com/material-ui/integrations/nextjs/
pnpm add @mui/material-nextjs @emotion/cache

# https://mui.com/material-ui/customization/theme-components/
```

## Zustand

```bash
# https://zustand.docs.pmnd.rs/getting-started/introduction
pnpm add zustand

# https://zustand.docs.pmnd.rs/guides/nextjs
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# biru-admin
