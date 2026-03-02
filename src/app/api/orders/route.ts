import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
	sendCustomerConfirmationEmail,
	sendAdminNotificationEmail,
} from '@/lib/email';

/**
 * Zod schema for file data
 */
const FileDataSchema = z.object({
	filename: z.string(),
	filepath: z.string(),
	filetype: z.enum(['DXF', 'OTHER']),
});

/**
 * Zod schema for order item validation at API boundary
 */
const OrderItemSchema = z.object({
	fileId: z.string().uuid().optional(), // Optional if fileData is provided
	fileData: FileDataSchema.optional(), // Optional if fileId is provided
	materialTypeId: z.string().uuid(),
	quantity: z.number().int().positive(),
	price: z.number().positive(),
});

/**
 * Zod schema for order creation request
 */
const CreateOrderSchema = z.object({
	items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
	extras: z.array(z.string().uuid()).optional(), // Array of ExtraService IDs
	logisticsCost: z.number().min(0).optional().default(0),
});

/**
 * POST /api/orders
 * Create a new order with items and extras
 */
export async function POST(request: NextRequest) {
	try {
		// Authenticate user
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		// Parse and validate request body
		const body = await request.json();
		const validatedData = CreateOrderSchema.parse(body);

		// Calculate items total price
		const itemsTotal = validatedData.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		);

		// Fetch extras from database and calculate extras total
		let extrasTotal = 0;
		let extraServices: { id: string; name: string; price: number }[] = [];

		if (validatedData.extras && validatedData.extras.length > 0) {
			extraServices = await prisma.extraService.findMany({
				where: {
					id: { in: validatedData.extras },
					isActive: true,
				},
				select: {
					id: true,
					name: true,
					price: true,
				},
			});

			extrasTotal = extraServices.reduce((sum, extra) => sum + extra.price, 0);
		}

		// Total price = items + logistics + extras
		const totalPrice = itemsTotal + validatedData.logisticsCost + extrasTotal;

		// Process items: create File records if needed
		const processedItems = await Promise.all(
			validatedData.items.map(async (item) => {
				let fileId = item.fileId;

				// If fileData is provided, create File record
				if (item.fileData && !fileId) {
					const file = await prisma.file.create({
						data: {
							userId: user.id,
							filename: item.fileData.filename,
							filepath: item.fileData.filepath,
							filetype: item.fileData.filetype,
						},
					});
					fileId = file.id;
				}

				if (!fileId) {
					throw new Error('Either fileId or fileData must be provided');
				}

				return {
					fileId,
					materialTypeId: item.materialTypeId,
					quantity: item.quantity,
					price: item.price,
				};
			})
		);

		// Create order with items and extras in a transaction
		const order = await prisma.order.create({
			data: {
				userId: user.id,
				status: 'PENDING',
				totalPrice,
				logisticsCost: validatedData.logisticsCost,
				items: {
					create: processedItems,
				},
				extras: {
					create: extraServices.map((extra) => ({
						extraServiceId: extra.id,
						quantity: 1,
						priceAtOrder: extra.price,
					})),
				},
			},
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
			},
		});

		// Send confirmation emails (non-blocking)
		const emailData = {
			orderId: order.id,
			customerEmail: order.user.email,
			customerName: order.user.firstName
				? `${order.user.firstName} ${order.user.lastName || ''}`
				: undefined,
			totalPrice: order.totalPrice,
			items: order.items.map((item) => ({
				filename: item.file.filename,
				materialName: item.materialType.material.name,
				materialType: `${item.materialType.width}x${item.materialType.length}x${item.materialType.height}mm`,
				quantity: item.quantity,
				price: item.price,
			})),
			extras: order.extras.map((e) => e.extraService.name),
		};

		// Send emails asynchronously (don't block response)
		Promise.all([
			sendCustomerConfirmationEmail(emailData),
			sendAdminNotificationEmail(emailData),
		]).catch((error) => {
			console.error('Error sending emails:', error);
			// Don't fail the request if emails fail
		});

		return NextResponse.json(
			{
				orderId: order.id,
				totalPrice: order.totalPrice,
				status: order.status,
				message: 'Order created successfully',
			},
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			);
		}

		console.error('Error creating order:', error);
		return NextResponse.json(
			{ error: 'Failed to create order' },
			{ status: 500 }
		);
	}
}

/**
 * GET /api/orders
 * List orders for the authenticated user
 * Admin can see all orders
 */
export async function GET(request: NextRequest) {
	try {
		// Authenticate user
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			);
		}

		// Get user from database to check role
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { role: true },
		});

		if (!dbUser) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			);
		}

		// Parse query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const status = searchParams.get('status');

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};

		// If not admin, only show user's own orders
		if (dbUser.role !== 'ADMIN') {
			where.userId = user.id;
		}

		// Filter by status if provided
		if (status && status !== 'ALL') {
			where.status = status;
		}

		// Fetch orders with pagination
		const [orders, total] = await Promise.all([
			prisma.order.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
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
					_count: {
						select: { items: true },
					},
				},
			}),
			prisma.order.count({ where }),
		]);

		return NextResponse.json({
			orders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Error fetching orders:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		);
	}
}
