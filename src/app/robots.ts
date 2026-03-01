import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickncut.app';

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/api/',
					'/dashboard/',
					'/my-orders/',
					'/profile/',
					'/checkout/',
					'/quote-success/',
					'/auth/password/',
				],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
