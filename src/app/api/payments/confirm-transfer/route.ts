import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import { sendPaymentConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';

const ConfirmTransferSchema = z.object({
	paymentId: z.string().uuid(),
	transferDetails: z
		.object({
			comprobante: z.string().optional(),
			banco: z.string().optional(),
			fecha: z.string().optional(),
			notas: z.string().optional(),
		})
		.optional(),
});

/**
 * POST /api/payments/confirm-transfer
 * Admin confirms a bank transfer payment
 */
export async function POST(request: NextRequest) {
	try {
		// Authenticate user
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { role: true },
		});

		if (!dbUser || dbUser.role !== 'ADMIN') {
			return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
		}

		// Validate request body
		const body = await request.json();
		const { paymentId, transferDetails } = ConfirmTransferSchema.parse(body);

		// Fetch payment
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
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
			return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
		}

		// Verify payment is a pending transfer
		if (payment.paymentMethod !== 'TRANSFER') {
			return NextResponse.json(
				{ error: 'Payment is not a bank transfer' },
				{ status: 400 }
			);
		}

		if (payment.status !== 'PENDING') {
			return NextResponse.json(
				{ error: 'Payment is not pending' },
				{ status: 400 }
			);
		}

		// Update payment and order in a transaction
		const [updatedPayment] = await prisma.$transaction([
			prisma.payment.update({
				where: { id: paymentId },
				data: {
					status: 'COMPLETED',
					paidAt: new Date(),
					transferDetails: transferDetails || Prisma.JsonNull,
				},
			}),
			prisma.order.update({
				where: { id: payment.orderId },
				data: { status: 'PAID' },
			}),
		]);

		// Send confirmation emails
		try {
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

			await Promise.all([
				sendPaymentConfirmationEmail({
					orderId: payment.order.id,
					customerEmail: payment.order.user.email,
					customerName,
					totalPrice: payment.amount,
					paymentMethod: 'Transferencia Bancaria',
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

		return NextResponse.json({
			success: true,
			payment: updatedPayment,
			message: 'Transfer confirmed successfully',
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error confirming transfer:', error);
		return NextResponse.json(
			{ error: 'Failed to confirm transfer' },
			{ status: 500 }
		);
	}
}
