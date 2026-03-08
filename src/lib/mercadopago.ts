import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Validate environment variable
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
	console.warn('MERCADOPAGO_ACCESS_TOKEN not configured');
}

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
	accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

// Export API instances
export const preferenceApi = new Preference(client);
export const paymentApi = new Payment(client);

// Payment method types
export type PaymentMethod = 'MERCADOPAGO' | 'TRANSFER';

// Bank transfer information
export const BANK_INFO = {
	holder: process.env.NEXT_PUBLIC_BANK_HOLDER || '',
	cbu: process.env.NEXT_PUBLIC_BANK_CBU || '',
	alias: process.env.NEXT_PUBLIC_BANK_ALIAS || '',
	bank: process.env.NEXT_PUBLIC_BANK_NAME || '',
	accountType: 'Cuenta Corriente',
} as const;

// Check if bank info is configured
export function isBankInfoConfigured(): boolean {
	return Boolean(BANK_INFO.cbu && BANK_INFO.holder);
}

// MercadoPago status mapping to our PaymentStatus
export function mapMercadoPagoStatus(
	mpStatus: string
): 'PENDING' | 'COMPLETED' | 'FAILED' {
	switch (mpStatus) {
		case 'approved':
			return 'COMPLETED';
		case 'rejected':
		case 'cancelled':
		case 'refunded':
		case 'charged_back':
			return 'FAILED';
		case 'pending':
		case 'in_process':
		case 'in_mediation':
		case 'authorized':
		default:
			return 'PENDING';
	}
}
