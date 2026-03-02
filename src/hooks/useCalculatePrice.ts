'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
	computeOrderPrices,
	type OrderPricingResult,
} from '@/app/(dashboard)/pricing/actions';
import type { QuotingCartItem } from '@/context/quotingContext';

/**
 * Computes pricing for all cart items + order-level logistics in a single server call.
 * Returns item breakdowns, logistics, and grandTotal.
 */
export function useCalculatePrice(items: QuotingCartItem[]) {
	return useQuery({
		queryKey: [
			'calculatePrice',
			items.map((item) => ({
				mtId: item.materialType?.id,
				qty: item.quantity,
				cl: item.file._cutLength?.totalMm,
				pc: item.file._piercings?.total,
				bw: item.file._boundingBox?.widthMm,
				bh: item.file._boundingBox?.heightMm,
				pa: item.file._pieceAreaMm2,
			})),
		],
		queryFn: async (): Promise<OrderPricingResult> => {
			// Build order items for items that have all required data
			const orderItems = items
				.map((item, index) => {
					if (
						!item.materialType ||
						!item.file._cutLength ||
						!item.file._piercings ||
						!item.file._boundingBox ||
						item.file._pieceAreaMm2 == null
					) {
						return null;
					}

					return {
						index,
						input: {
							materialTypeId: item.materialType.id,
							boundingBoxWidthMm: item.file._boundingBox.widthMm,
							boundingBoxHeightMm: item.file._boundingBox.heightMm,
							pieceAreaCm2: item.file._pieceAreaMm2 / 100,
							cutLengthMm: item.file._cutLength.totalMm,
							piercingCount: item.file._piercings.total,
							quantity: item.quantity,
						},
					};
				})
				.filter(
					(item): item is NonNullable<typeof item> => item !== null
				);

			if (orderItems.length === 0) {
				return {
					items: [],
					logistics: {
						totalOrderWeightKg: 0,
						numberOfShipments: 0,
						packagingCost: 0,
						dispatchCost: 0,
						shippingCost: 0,
						logisticsSubtotal: 0,
						logisticsCommission: 0,
						logisticsTotal: 0,
					},
					freeShippingThreshold: 0,
					isFreeShipping: false,
					shippingCost: 0,
					grandTotal: 0,
				};
			}

			const result = await computeOrderPrices(
				orderItems.map((o) => o.input)
			);

			if (!result.success) {
				throw new Error(result.error);
			}

			// Remap itemIndex from server (sequential 0..N) to actual cart indices
			const remapped = result.result.items.map((serverItem, i) => ({
				...serverItem,
				itemIndex: orderItems[i].index,
			}));

			return {
				...result.result,
				items: remapped,
			};
		},
		enabled:
			items.length > 0 &&
			items.some(
				(item) =>
					item.materialType &&
					item.file._cutLength &&
					item.file._piercings &&
					item.file._boundingBox &&
					item.file._pieceAreaMm2 != null
			),
		staleTime: 30 * 1000, // 30 seconds
		// Keep previous data visible while recalculating with new query key.
		// Without this, changing one item's quantity causes ALL prices to
		// flash to a loading spinner because TanStack Query treats the new
		// query key as a brand-new query with no cached data.
		placeholderData: keepPreviousData,
	});
}
