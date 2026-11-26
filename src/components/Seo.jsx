// Per-page SEO.
//
// Why this edits the <head> in an effect instead of rendering <title>/<meta>:
// index.html already ships fallback tags for crawlers that don't run JS, and
// React 19's native hoisting would ADD a second set (duplicate canonical /
// description tags). Updating the existing tags avoids that.
//
// Usage:
//   <Seo title="Contact us" description="..." path="/contact" />
//   <Seo title="Log in" path="/login" noindex />          // private/utility pages
//   <Seo path="/" jsonLd={homeJsonLd} />

import { useEffect } from 'react'

const SITE = 'https://www.chametu.co.ke'
const NAME = 'Chametu'
const DEFAULT_TITLE = `${NAME} | Chama Management Software in Kenya`
const DEFAULT_DESC =
  'Chametu is chama management software for Kenya: track contributions, M-Pesa payments, loans, welfare, investments, meetings and reports in one secure ledger.'
const DEFAULT_IMAGE = `${SITE}/og-image.png`

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data) {
  const id = 'seo-jsonld'
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = '/',
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
}) {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const fullTitle = title ? `${title} | ${NAME}` : DEFAULT_TITLE
    const url = `${SITE}${path === '/' ? '' : path}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    )
    setCanonical(noindex ? null : url)

    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', NAME)
    setMeta('property', 'og:locale', 'en_KE')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    setJsonLd(jsonKey ? JSON.parse(jsonKey) : null)
  }, [title, description, path, image, noindex, jsonKey])

  return null
}

// Structured data for the home page.
export const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: NAME,
    url: SITE,
    logo: `${SITE}/logos.png`,
    email: 'support@chametu.co.ke',
    address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
    sameAs: ['https://twitter.com/chametu', 'https://linkedin.com/company/chametu'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: NAME,
    url: SITE,
    inLanguage: 'en-KE',
  },
  {
    // No ratings/review counts on purpose: invented ones violate Google's
    // structured-data policy. Add `offers` only with your real plan prices.
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: NAME,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web, Android, iOS (PWA)',
    description: DEFAULT_DESC,
    url: SITE,
    areaServed: 'KE',
  },
]