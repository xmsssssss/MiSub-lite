import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  // 性能优化构建配置
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        // 手动代码分割（保守策略，避免循环依赖导致空白页）
        manualChunks: {
          vue: ['vue'],
          router: ['vue-router'],
          pinia: ['pinia']
        },
        // 优化文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash][extname]`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/img/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/${ext}/[name]-[hash][extname]`
        }
      }
    },
    // 压缩配置
    minify: 'terser',

    // terserOptions removed for debugging
  },
  // 开发服务器配置（后端默认 8787，可用 VITE_API_PROXY 覆盖）
  server: {
    proxy: (() => {
      const target = process.env.VITE_API_PROXY || 'http://127.0.0.1:8787';
      return {
        '/api': { target, changeOrigin: true },
        '/sub/': { target, changeOrigin: true },
        '/cron': { target, changeOrigin: true },
        '^/(?!@|api/|sub/|cron|assets/|@vite/|src/|icons/|images/)[^/]+/[^/]+$': {
          target,
          changeOrigin: true
        }
      };
    })()
  },
  // 依赖优化
  optimizeDeps: {
    include: [
      'vue',
      'pinia'
    ]
  },
  // 路径解析
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
