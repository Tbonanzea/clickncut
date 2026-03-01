import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { preferenceApi } from '@/lib/mercadopago';
import { z } from 'zod';

const CreatePreferenceSchema = z.object({
	orderId: z.string().uuid(),
});

/**
 * POST /api/payments/create-preference
 * Creates a MercadoPago payment preference for an order
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

		// Validate request body
		const body = await request.json();
		const { orderId } = CreatePreferenceSchema.parse(body);

		// Fetch order with items
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
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
				user: {
					select: {
						email: true,
						firstName: true,
						lastName: true,
					},
				},
				payments: {
					where: {
						status: 'PENDING',
						paymentMethod: 'MERCADOPAGO',
					},
				},
			},
		});

		if (!order) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 });
		}

		// Verify user owns this order
		if (order.userId !== user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}

		// Verify order is in PENDING status
		if (order.status !== 'PENDING') {
			return NextResponse.json(
				{ error: 'Order is not pending payment' },
				{ status: 400 }
			);
		}

		// Check if there's already a pending MP payment
		const existingPayment = order.payments.find(
			(p) => p.mercadopagoId && p.status === 'PENDING'
		);

		if (existingPayment?.mercadopagoId) {
			// Return existing preference init_point
			try {
				const existingPreference = await preferenceApi.get({
					preferenceId: existingPayment.mercadopagoId,
				});

				if (existingPreference.init_point) {
					return NextResponse.json({
						init_point: existingPreference.init_point,
						sandbox_init_point: existingPreference.sandbox_init_point,
						paymentId: existingPayment.id,
					});
				}
			} catch {
				// Preference expired or invalid, create a new one
			}
		}

		// Build items for MercadoPago
		const mpItems = order.items.map((item) => ({
			id: item.id,
			title: `${item.materialType.material.name} - ${item.file.filename}`,
			description: `${item.materialType.width}x${item.materialType.length}x${item.materialType.height}mm`,
			quantity: item.quantity,
			unit_price: item.price,
			currency_id: 'ARS',
		}));

		// Add extras as items
		order.extras.forEach((extra) => {
			mpItems.push({
				id: extra.id,
				title: extra.extraService.name,
				description: extra.extraService.description || 'Servicio adicional',
				quantity: extra.quantity,
				unit_price: extra.priceAtOrder,
				currency_id: 'ARS',
			});
		});

		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

		// Create MercadoPago preference
		const preference = await preferenceApi.create({
			body: {
				items: mpItems,
				payer: {
					email: order.user.email,
					name: order.user.firstName || undefined,
					surname: order.user.lastName || undefined,
				},
				back_urls: {
					success: `${siteUrl}/checkout/success?orderId=${orderId}`,
					failure: `${siteUrl}/checkout/failure?orderId=${orderId}`,
					pending: `${siteUrl}/checkout/pending?orderId=${orderId}`,
				},
				auto_return: 'approved',
				external_reference: orderId,
				notification_url: `${siteUrl}/api/webhooks/mercadopago`,
				statement_descriptor: 'CLICKNCUT',
				expires: true,
				expiration_date_from: new Date().toISOString(),
				expiration_date_to: new Date(
					Date.now() + 24 * 60 * 60 * 1000
				).toISOString(), // 24 hours
			},
		});

		if (!preference.id) {
			throw new Error('Failed to create MercadoPago preference');
		}

		// Create or update Payment record
		let payment;
		if (existingPayment) {
			payment = await prisma.payment.update({
				where: { id: existingPayment.id },
				data: {
					mercadopagoId: preference.id,
					amount: order.totalPrice,
				},
			});
		} else {
			payment = await prisma.payment.create({
				data: {
					orderId: order.id,
					paymentMethod: 'MERCADOPAGO',
					status: 'PENDING',
					amount: order.totalPrice,
					mercadopagoId: preference.id,
				},
			});
		}

		return NextResponse.json({
			init_point: preference.init_point,
			sandbox_init_point: preference.sandbox_init_point,
			paymentId: payment.id,
			preferenceId: preference.id,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error creating payment preference:', error);
		return NextResponse.json(
			{ error: 'Failed to create payment preference' },
			{ status: 500 }
		);
	}
}
