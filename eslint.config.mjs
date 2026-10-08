import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
    {
        ignores: [
            '.next/**',
            'out/**',
            'build/**',
            'node_modules/**',
            'next-env.d.ts',
            // артефакты и служебные скрипты design-sync
            'ds-bundle/**',
            '.ds-sync/**',
            '.design-sync/**',
            'baseline/**',
        ],
    },
    // next/core-web-vitals уже включает react-hooks (rules-of-hooks, exhaustive-deps)
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default eslintConfig
