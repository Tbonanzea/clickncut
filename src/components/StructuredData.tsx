export function LocalBusinessJsonLd() {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickncut.com';

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		'@id': `${baseUrl}/#business`,
		name: 'ClicknCut',
		description:
			'Plataforma de corte láser personalizado. Servicios de corte de precisión en metal, acrílico, MDF y más materiales.',
		url: baseUrl,
		logo: `${baseUrl}/logo.png`,
		image: `${baseUrl}/og-image.png`,
		telephone: '+54 9 351 XXXX-XXXX', // TODO: Replace with actual phone
		email: 'contacto@clickncut.com', // TODO: Replace with actual email
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Cordoba',
			addressRegion: 'Cordoba',
			addressCountry: 'AR',
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: -31.4201, // Cordoba coordinates
			longitude: -64.1888,
		},
		openingHoursSpecification: [
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: [
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
				],
				opens: '09:00',
				closes: '18:00',
			},
		],
		priceRange: '$$',
		currenciesAccepted: 'ARS',
		paymentAccepted: 'MercadoPago, Transferencia Bancaria',
		areaServed: {
			'@type': 'Country',
			name: 'Argentina',
		},
		hasOfferCatalog: {
			'@type': 'OfferCatalog',
			name: 'Servicios de Corte',
			itemListElement: [
				{
					'@type': 'Offer',
					itemOffered: {
						'@type': 'Service',
						name: 'Corte Láser',
						description:
							'Corte láser de precisión en diversos materiales',
					},
				},
				{
					'@type': 'Offer',
					itemOffered: {
						'@type': 'Service',
						name: 'Grabado Láser',
						description: 'Grabado y marcado láser personalizado',
					},
				},
			],
		},
		sameAs: [
			// TODO: Add social media URLs
			// 'https://www.instagram.com/clickncut',
			// 'https://www.facebook.com/clickncut',
		],
	};

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}

export function WebsiteJsonLd() {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickncut.com';

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${baseUrl}/#website`,
		url: baseUrl,
		name: 'ClicknCut',
		description: 'Plataforma de corte láser personalizado',
		publisher: {
			'@id': `${baseUrl}/#business`,
		},
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${baseUrl}/quoting?search={search_term_string}`,
			},
			'query-input': 'required name=search_term_string',
		},
	};

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}

export function BreadcrumbJsonLd({
	items,
}: {
	items: { name: string; url: string }[];
}) {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickncut.com';

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url.startsWith('http')
				? item.url
				: `${baseUrl}${item.url}`,
		})),
	};

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}
