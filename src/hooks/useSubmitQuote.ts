'use client';

import { useMutation } from '@tanstack/react-query';
import { useQuoting } from '@/context/quotingContext';
import { useRouter } from 'next/navigation';
import {
	computeOrderPrices,
	type OrderItemInput,
} from '@/app/(dashboard)/pricing/actions';

interface SubmitOrderResponse {
	orderId: string;
	totalPrice: number;
	message: string;
}

/**
 * Helper function to upload a file to Supabase Storage
 */
async function uploadFileToStorage(file: File, fileName: string): Promise<string> {
	const reader = new FileReader();
	const fileContentPromise = new Promise<string>((resolve, reject) => {
		reader.onload = () => {
			const result = reader.result as string;
			const base64Content = result.split(',')[1];
			resolve(base64Content);
		};
		reader.onerror = reject;
	});
	reader.readAsDataURL(file);

	const fileContent = await fileContentPromise;

	const response = await fetch('/api/file', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			fileName,
			fileContent,
			contentType: file.type || 'application/dxf',
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to upload file');
	}

	const result = await response.json();
	return result.path;
}

/**
 * TanStack Query mutation hook for submitting an order.
 * Creates the order with billing/shipping data, then handles payment:
 * - MercadoPago: creates preference and redirects
 * - Transfer: creates transfer record and redirects to pending page
 */
export function useSubmitOrder() {
	const { cart, checkoutData } = useQuoting();
	const router = useRouter();

	return useMutation<SubmitOrderResponse, Error, void>({
		mutationFn: async () => {
			// Validation
			if (cart.items.length === 0) {
				throw new Error('No items in cart');
			}

			const invalidItems = cart.items.filter(
				(item) =>
					!item.file ||
					!item.material ||
					!item.materialType ||
					item.quantity <= 0
			);

			if (invalidItems.length > 0) {
				throw new Error('Some cart items are incomplete');
			}

			if (!checkoutData.paymentMethod) {
				throw new Error('No payment method selected');
			}

			// Step 1: Upload all files to Supabase Storage
			const uploadPromises = cart.items.map(async (item, idx) => {
				if (item.file._rawFile) {
					const timestamp = Date.now();
					const sanitizedFilename = item.file.filename.replace(
						/[^a-zA-Z0-9.-]/g,
						'_'
					);
					const fileName = `${timestamp}-${idx}-${sanitizedFilename}`;
					const storagePath = await uploadFileToStorage(item.file._rawFile, fileName);

					return {
						...item,
						file: {
							...item.file,
							filepath: storagePath,
						},
					};
				}
				return item;
			});

			const uploadedItems = await Promise.all(uploadPromises);

			// Step 2: Compute order prices server-side
			const pricingItems: OrderItemInput[] = uploadedItems
				.filter(
					(item) =>
						item.file._cutLength &&
						item.file._piercings &&
						item.file._boundingBox &&
						item.file._pieceAreaMm2 != null
				)
				.map((item) => ({
					materialTypeId: item.materialType!.id,
					boundingBoxWidthMm: item.file._boundingBox!.widthMm,
					boundingBoxHeightMm: item.file._boundingBox!.heightMm,
					pieceAreaCm2: item.file._pieceAreaMm2! / 100,
					cutLengthMm: item.file._cutLength!.totalMm,
					piercingCount: item.file._piercings!.total,
					quantity: item.quantity,
				}));

			let logisticsCost = 0;
			const itemPrices = new Map<number, number>();

			if (pricingItems.length > 0) {
				const priceResult = await computeOrderPrices(pricingItems);
				if (priceResult.success) {
					logisticsCost = priceResult.result.shippingCost;
					for (const { itemIndex, breakdown } of priceResult.result.items) {
						itemPrices.set(itemIndex, breakdown.unitSalePrice);
					}
				}
			}

			// Step 3: Build order items
			let pricingIdx = 0;
			const orderItems = uploadedItems.map((item) => {
				let price = item.materialType!.pricePerUnit; // fallback

				if (
					item.file._cutLength &&
					item.file._piercings &&
					item.file._boundingBox &&
					item.file._pieceAreaMm2 != null
				) {
					const computedPrice = itemPrices.get(pricingIdx);
					if (computedPrice !== undefined) {
						price = computedPrice;
					}
					pricingIdx++;
				}

				return {
					fileData: {
						filename: item.file.filename,
						filepath: item.file.filepath,
						filetype: item.file.filetype,
					},
					materialTypeId: item.materialType!.id,
					quantity: item.quantity,
					price,
				};
			});

			// Step 4: Create order with billing/shipping data
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: orderItems,
					extras: cart.extras,
					logisticsCost,
					// Billing
					invoiceType: checkoutData.invoiceType,
					customerName:
						checkoutData.invoiceType === 'CONSUMIDOR_FINAL'
							? checkoutData.customerName
							: checkoutData.businessName,
					customerPhone: checkoutData.customerPhone,
					dni: checkoutData.dni || undefined,
					cuit: checkoutData.cuit || undefined,
					businessName: checkoutData.businessName || undefined,
					taxCondition: checkoutData.taxCondition || undefined,
					// Shipping
					shippingAddress: checkoutData.shippingAddress,
					shippingCity: checkoutData.shippingCity,
					shippingProvince: checkoutData.shippingProvince,
					shippingZipCode: checkoutData.shippingZipCode,
					shippingNotes: checkoutData.shippingNotes || undefined,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create order');
			}

			const orderData = await response.json();
			const orderId = orderData.orderId;

			// Step 5: Handle payment
			if (checkoutData.paymentMethod === 'mercadopago') {
				const paymentResponse = await fetch('/api/payments/create-preference', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ orderId }),
				});

				if (!paymentResponse.ok) {
					const paymentError = await paymentResponse.json();
					throw new Error(paymentError.error || 'Error al crear preferencia de pago');
				}

				const paymentData = await paymentResponse.json();
				const redirectUrl = paymentData.sandbox_init_point || paymentData.init_point;

				if (!redirectUrl) {
					throw new Error('No se recibió URL de pago');
				}

				// Redirect to MercadoPago — this navigates away from the app
				window.location.href = redirectUrl;

				// Return data while redirect happens
				return {
					orderId,
					totalPrice: orderData.totalPrice,
					message: 'Redirigiendo a MercadoPago...',
				};
			} else {
				// Bank transfer
				const transferResponse = await fetch('/api/payments/create-transfer', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ orderId }),
				});

				if (!transferResponse.ok) {
					const transferError = await transferResponse.json();
					throw new Error(transferError.error || 'Error al registrar transferencia');
				}

				return {
					orderId,
					totalPrice: orderData.totalPrice,
					message: 'Pedido registrado, pendiente de transferencia',
				};
			}
		},
		onSuccess: (data) => {
			// Only redirect if not MercadoPago (MP redirect happens in mutationFn)
			if (checkoutData.paymentMethod === 'transfer') {
				router.replace(`/checkout/pending?orderId=${data.orderId}&amount=${data.totalPrice}`);
			}
		},
		onError: (error) => {
			console.error('Error submitting order:', error);
		},
	});
}
