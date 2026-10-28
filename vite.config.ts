import vue from '@vitejs/plugin-vue'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// 离线完整包清单：构建完成后列出 dist 里的全部文件（路径、字节数、SHA-256），版本号由全部内容决定。
// 页面首次进入时按清单把整包下载进以版本命名的缓存，Service Worker 只从下载完整的那一版取文件（新旧资源不混用）。
function offlineManifest(): Plugin {
  let out = 'dist'
  return {
    name: 'offline-manifest',
    apply: 'build',
    configResolved(c) { out = c.build.outDir },
    closeBundle() {
      const files: { p: string; n: number; h: string }[] = []
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const full = join(dir, f)
          if (statSync(full).isDirectory()) walk(full)
          else {
            const p = '/' + relative(out, full).replace(/\\/g, '/')
            if (p === '/offline-manifest.json' || p === '/sw.js') continue
            const buf = readFileSync(full)
            files.push({ p, n: buf.length, h: createHash('sha256').update(buf).digest('hex').slice(0, 16) })
          }
        }
      }
      walk(out)
      files.sort((a, b) => a.p.localeCompare(b.p))
      const version = createHash('sha256').update(files.map((f) => f.p + f.h).join('\n')).digest('hex').slice(0, 12)
      const bytes = files.reduce((a, f) => a + f.n, 0)
      writeFileSync(join(out, 'offline-manifest.json'), JSON.stringify({ version, bytes, files }))
      console.log(`离线包清单：${files.length} 个文件，${(bytes / 1048576).toFixed(1)} MiB，版本 ${version}`)
    },
  }
}

// main.ts 先定语言再动态载入 App：把 App 主包写进 HTML 预加载，下载不必等入口脚本执行（只预取，不执行）
function preloadApp(): Plugin {
  return {
    name: 'preload-app',
    apply: 'build',
    transformIndexHtml: (html, ctx) => {
      const app = Object.values(ctx.bundle ?? {}).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/App.vue'))
      return app ? html.replace('</head>', `  <link rel="modulepreload" crossorigin href="/${app.fileName}">
  </head>`) : html
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), offlineManifest(), preloadApp()],
  define: { 'import.meta.env.VITE_VERSION': JSON.stringify(JSON.parse(readFileSync('package.json', 'utf8')).version) }, // 关于页显示的版本号
})
