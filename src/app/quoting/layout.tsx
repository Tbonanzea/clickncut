import { Metadata } from 'next';
import QuotingContent from './QuotingContent';

export const metadata: Metadata = {
	title: 'Cotizador',
	description:
		'Sube tu archivo DXF, selecciona el material y obtén una cotización instantánea para tu proyecto de corte láser.',
	openGraph: {
		title: 'Cotizador de Corte Láser | ClicknCut',
		description:
			'Sube tu archivo DXF, selecciona el material y obtén una cotización instantánea para tu proyecto de corte láser.',
	},
};

export default function QuotingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <QuotingContent>{children}</QuotingContent>;
}
