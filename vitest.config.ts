import { resolve } from 'path'
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        restoreMocks: true,
        fileParallelism: true,
        globals: true,
        root: './',
    },
    plugins: [
        swc.vite({
            module: { type: 'es6' },
        }),
    ],
    resolve: {
        alias: {
            src: resolve(__dirname, './src'),
        },
    },
})
