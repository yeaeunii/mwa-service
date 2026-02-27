import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'webview'
          }
        }
      }),
      tailwindcss(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/composables', 'src/stores', 'src/types'],
        dirsScanOptions: {
          types: true
        },
        vueTemplate: true,
        eslintrc: {
          enabled: true,
          filepath: resolve('.eslintrc-auto-import.json')
        }
      }),
      Components({
        dts: 'src/components.d.ts',
        dirs: ['src/components', 'src/components', 'src/views/**/components'],
        resolvers: [IconsResolver()]
      }),
      Icons({
        autoInstall: true
      })
    ]
  }
})
