// scripts/prerender.mjs
// Runs after `vite build`. Opens the built site in headless Chrome, lets React
// render each public route, and saves the finished HTML (with per-page title,
// meta tags and JSON-LD) into dist/. Crawlers that don't run JavaScript then
// see real content. The app itself is unchanged: React still takes over on load.
//
// This script NEVER fails the build. If puppeteer isn't installed or Chrome
// can't launch, it logs "[prerender] skipped" and the normal SPA ships.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const ROUTES = ['/', '/register', '/rewards/how-it-works', '/contact', '/privacy', '/terms']

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.mp4': 'video/mp4',
}

const log = (...a) => console.log('[prerender]', ...a)

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) return log('skipped: dist/index.html not found')

  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch {
    return log('skipped: puppeteer not installed (run: npm i -D puppeteer)')
  }

  // Keep the pristine shell in memory: we overwrite dist/index.html for "/".
  const shell = await readFile(path.join(DIST, 'index.html'))

  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      const file = path.join(DIST, urlPath)
      const isFile = path.extname(urlPath) && file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()
      if (isFile) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
        res.end(await readFile(file))
      } else {
        res.writeHead(200, { 'Content-Type': MIME['.html'] })
        res.end(shell)
      }
    } catch {
      res.writeHead(500)
      res.end()
    }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const origin = `http://127.0.0.1:${server.address().port}`

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  } catch (e) {
    server.close()
    return log('skipped: could not launch Chrome:', e.message.split('\n')[0])
  }

  let done = 0
  for (const route of ROUTES) {
    const page = await browser.newPage()
    try {
      // No service worker while snapshotting.
      await page.evaluateOnNewDocument(() => { try { delete Navigator.prototype.serviceWorker } catch {} })
      // Only load our own files: external APIs/fonts would be slow or blocked by CORS.
      await page.setRequestInterception(true)
      page.on('request', (r) => (r.url().startsWith(origin) || r.url().startsWith('data:') ? r.continue() : r.abort()))

      await page.goto(origin + route, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.waitForSelector('h1', { timeout: 15000 })
      await new Promise((r) => setTimeout(r, 600)) // let <Seo /> effects run

      await page.evaluate((p) => {
        document.documentElement.removeAttribute('data-theme') // don't bake a theme into the snapshot
        document.getElementById('root').setAttribute('data-prerendered', p)
      }, route === '/' ? '/' : route)

      const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML))
      if (!html.includes('<h1') || html.length < 3000) throw new Error('snapshot looks empty')

      const out = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html')
      await mkdir(path.dirname(out), { recursive: true })
      await writeFile(out, html)
      done++
      log('ok', route, `(${Math.round(html.length / 1024)} KB)`)
    } catch (e) {
      log('failed', route, '-', e.message.split('\n')[0], '(left as normal SPA page)')
    } finally {
      await page.close().catch(() => {})
    }
  }

  await browser.close().catch(() => {})
  server.close()
  log(`done: ${done}/${ROUTES.length} routes prerendered`)
}

main().catch((e) => log('skipped: unexpected error:', e.message))