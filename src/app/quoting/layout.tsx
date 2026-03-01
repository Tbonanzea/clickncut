import { Metadata } from 'next';
import QuotingContent from './QuotingContent';

export const metadata: Metadata = {
	title: 'Cotizador',
	description:
		'Sube tu archivo DXF, selecciona el material y obtén una cotización instantánea para tu proyecto de corte láser o CNC.',
	openGraph: {
		title: 'Cotizador de Corte Láser y CNC | ClicknCut',
		description:
			'Sube tu archivo DXF, selecciona el material y obtén una cotización instantánea para tu proyecto de corte láser o CNC.',
	},
};

export default function QuotingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <QuotingContent>{children}</QuotingContent>;
}
