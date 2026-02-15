'use client';

import { useMutation } from '@tanstack/react-query';
import { useQuoting } from '@/context/quotingContext';
import { useRouter } from 'next/navigation';

interface SubmitQuoteResponse {
	orderId: string;
	totalPrice: number;
	message: string;
}

/**
 * Helper function to upload a file to S3
 */
async function uploadFileToS3(file: File, fileName: string): Promise<string> {
	// Read file as base64
	const reader = new FileReader();
	const fileContentPromise = new Promise<string>((resolve, reject) => {
		reader.onload = () => {
			const result = reader.result as string;
			// Extract base64 content (remove data:mime;base64, prefix)
			const base64Content = result.split(',')[1];
			resolve(base64Content);
		};
		reader.onerror = reject;
	});
	reader.readAsDataURL(file);

	const fileContent = await fileContentPromise;

	// Upload to S3 via API route
	const response = await fetch('/api/file', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
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

	// Return the storage path from server (includes userId prefix)
	const result = await response.json();
	return result.path;
}

/**
 * TanStack Query mutation hook for submitting quote
 * Handles file upload to S3 and order creation
 */
export function useSubmitQuote() {
	const { cart } = useQuoting();
	const router = useRouter();

	return useMutation<SubmitQuoteResponse, Error, void>({
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

			// Step 1: Upload all files to Supabase Storage (only if they have _rawFile)
			// The server adds the userId prefix to the path automatically
			const uploadPromises = cart.items.map(async (item, idx) => {
				if (item.file._rawFile) {
					const timestamp = Date.now();
					const sanitizedFilename = item.file.filename.replace(
						/[^a-zA-Z0-9.-]/g,
						'_'
					);
					const fileName = `${timestamp}-${idx}-${sanitizedFilename}`;

					// Upload to Supabase Storage via API route (server adds userId prefix)
					const storagePath = await uploadFileToS3(item.file._rawFile, fileName);

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

			// Step 2: Create order via API
			// Prepare order items for API
			const orderItems = uploadedItems.map((item) => ({
				fileData: {
					filename: item.file.filename,
					filepath: item.file.filepath,
					filetype: item.file.filetype,
				},
				materialTypeId: item.materialType!.id,
				quantity: item.quantity,
				price: item.materialType!.pricePerUnit,
			}));

			// Call orders API
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					items: orderItems,
					extras: cart.extras,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create order');
			}

			const data = await response.json();

			return {
				orderId: data.orderId,
				totalPrice: data.totalPrice,
				message: data.message || 'Cotización enviada exitosamente',
			};
		},
		onSuccess: (data) => {
			// Navigate outside /quoting/* so QuotingProvider unmounts and cart resets automatically
			router.replace(`/quote-success?orderId=${data.orderId}`);
		},
		onError: (error) => {
			console.error('Error submitting quote:', error);
			// Error handling is done by the component using this hook
		},
	});
}
