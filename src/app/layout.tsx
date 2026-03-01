import Footer from '@/components/Footer';
import Header from '@/components/Header';
import {
	LocalBusinessJsonLd,
	WebsiteJsonLd,
} from '@/components/StructuredData';
import '@/styles/globals.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Providers } from './providers';

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL || 'https://clickncut.com',
	),
	title: {
		default: 'ClicknCut - Corte Láser y CNC Personalizado',
		template: '%s | ClicknCut',
	},
	description:
		'Plataforma de corte láser y CNC personalizado. Sube tu diseño DXF, elige el material y recibe tu pieza cortada con precisión.',
	keywords: [
		'corte láser',
		'CNC',
		'corte personalizado',
		'DXF',
		'metal',
		'acrílico',
		'fabricación',
	],
	authors: [{ name: 'ClicknCut' }],
	creator: 'ClicknCut',
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
		],
		apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
	},
	manifest: '/site.webmanifest',
	openGraph: {
		type: 'website',
		locale: 'es_AR',
		siteName: 'ClicknCut',
		title: 'ClicknCut - Corte Láser y CNC Personalizado',
		description:
			'Plataforma de corte láser y CNC personalizado. Sube tu diseño DXF, elige el material y recibe tu pieza cortada con precisión.',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'ClicknCut - Corte Láser y CNC Personalizado',
		description:
			'Plataforma de corte láser y CNC personalizado. Sube tu diseño DXF, elige el material y recibe tu pieza cortada con precisión.',
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang='es'>
			<head>
				<LocalBusinessJsonLd />
				<WebsiteJsonLd />
			</head>
			<body className='min-h-screen flex flex-col'>
				<Providers>
					<Header />
					<main className='flex-1 pt-20'>{children}</main>
					<Footer />
					<Toaster richColors position='top-right' />
				</Providers>
				<Analytics />
			</body>
		</html>
	);
}
