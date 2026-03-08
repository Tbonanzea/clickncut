import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentApi, mapMercadoPagoStatus } from '@/lib/mercadopago';
import { sendPaymentConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';

/**
 * POST /api/webhooks/mercadopago
 * Receives payment notifications from MercadoPago
 *
 * MercadoPago sends notifications for:
 * - payment: When a payment is created or updated
 * - merchant_order: When an order is created or updated
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Log webhook for debugging
		console.log('MercadoPago Webhook received:', JSON.stringify(body, null, 2));

		// Handle different notification types
		const { type, data } = body;

		if (type === 'payment' && data?.id) {
			await handlePaymentNotification(data.id);
		} else if (type === 'merchant_order' && data?.id) {
			// Merchant orders can contain multiple payments
			// For now, we only process individual payment notifications
			console.log('Merchant order notification received:', data.id);
		}

		// Always return 200 to acknowledge receipt
		// MercadoPago will retry if we return an error
		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing webhook:', error);
		// Still return 200 to prevent MercadoPago from retrying
		// Log the error for manual investigation
		return NextResponse.json({ received: true, error: 'processed' }, { status: 200 });
	}
}

/**
 * Handle payment notification from MercadoPago
 */
async function handlePaymentNotification(mpPaymentId: string) {
	try {
		// Fetch payment details from MercadoPago
		const mpPayment = await paymentApi.get({ id: mpPaymentId });

		if (!mpPayment) {
			console.error('Payment not found in MercadoPago:', mpPaymentId);
			return;
		}

		console.log('MercadoPago Payment status:', mpPayment.status);

		// Get the order ID from external_reference
		const orderId = mpPayment.external_reference;

		if (!orderId) {
			console.error('No external_reference in payment:', mpPaymentId);
			return;
		}

		// Find the payment record in our database
		// The preference ID is stored in mercadopagoId, but the webhook sends the payment ID
		// We need to find by orderId and update with the payment ID
		const payment = await prisma.payment.findFirst({
			where: {
				orderId: orderId,
				paymentMethod: 'MERCADOPAGO',
				status: 'PENDING',
			},
			include: {
				order: {
					include: {
						user: {
							select: {
								email: true,
								firstName: true,
								lastName: true,
							},
						},
						items: {
							include: {
								file: true,
								materialType: {
									include: {
										material: true,
									},
								},
							},
						},
						extras: {
							include: {
								extraService: true,
							},
						},
					},
				},
			},
		});

		if (!payment) {
			console.error('Payment record not found for order:', orderId);
			return;
		}

		// Map MP status to our status
		const newStatus = mapMercadoPagoStatus(mpPayment.status || '');

		// Check for idempotency - don't process if already completed
		if (payment.status === 'COMPLETED') {
			console.log('Payment already completed, skipping:', payment.id);
			return;
		}

		// Update payment record
		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: newStatus,
				mercadopagoStatus: mpPayment.status,
				paidAt: newStatus === 'COMPLETED' ? new Date() : null,
			},
		});

		// If payment is completed, update order status
		if (newStatus === 'COMPLETED') {
			await prisma.order.update({
				where: { id: orderId },
				data: { status: 'PAID' },
			});

			const emailItems = payment.order.items.map((item) => ({
				filename: item.file.filename,
				materialName: item.materialType.material.name,
				materialType: `${item.materialType.width}x${item.materialType.length}x${item.materialType.height}mm`,
				quantity: item.quantity,
				price: item.price,
			}));

			const customerName = payment.order.user.firstName
				? `${payment.order.user.firstName} ${payment.order.user.lastName || ''}`
				: undefined;

			// Send payment confirmation and admin notification emails
			try {
				await Promise.all([
					sendPaymentConfirmationEmail({
						orderId: payment.order.id,
						customerEmail: payment.order.user.email,
						customerName,
						totalPrice: payment.amount,
						paymentMethod: 'MercadoPago',
						items: emailItems,
					}),
					sendAdminNotificationEmail({
						orderId: payment.order.id,
						customerEmail: payment.order.user.email,
						customerName,
						totalPrice: payment.order.totalPrice,
						items: emailItems,
						extras: payment.order.extras.map((e) => e.extraService.name),
					}),
				]);
			} catch (emailError) {
				console.error('Error sending emails:', emailError);
			}

			console.log('Order marked as PAID:', orderId);
		} else if (newStatus === 'FAILED') {
			console.log('Payment failed for order:', orderId);
		}
	} catch (error) {
		console.error('Error handling payment notification:', error);
		throw error;
	}
}

/**
 * GET /api/webhooks/mercadopago
 * MercadoPago may send GET requests to verify the webhook URL
 */
export async function GET() {
	return NextResponse.json({ status: 'ok' }, { status: 200 });
}
