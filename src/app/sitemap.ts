import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altum-analytics.vercel.app'

    // Static pages
    const staticPages = [
        '',          // Home (landing)
        '/dashboard',
        '/cards',
        '/login',
        '/signup',
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    return staticPages
}
