import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Checkout',
	description:
		'Completa tu pedido de corte láser. Paga de forma segura con MercadoPago o transferencia bancaria.',
	robots: {
		index: false,
		follow: false,
	},
};

export default function CheckoutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
