'use client';

import { useQuery } from '@tanstack/react-query';
import { computeQuotePrice } from '@/app/(dashboard)/pricing/actions';
import type { PricingBreakdown } from '@/lib/pricing-engine';
import type { QuotingCartItem } from '@/context/quotingContext';

export interface PriceResult {
	itemIndex: number;
	breakdown: PricingBreakdown;
}

/**
 * Computes pricing for all cart items using the server-side pricing engine.
 * Calls computeQuotePrice for each item with its geometric DXF data.
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
		queryFn: async (): Promise<PriceResult[]> => {
			const results = await Promise.all(
				items.map(async (item, index) => {
					if (
						!item.materialType ||
						!item.file._cutLength ||
						!item.file._piercings ||
						!item.file._boundingBox ||
						item.file._pieceAreaMm2 == null
					) {
						return null;
					}

					const result = await computeQuotePrice({
						materialTypeId: item.materialType.id,
						boundingBoxWidthMm: item.file._boundingBox.widthMm,
						boundingBoxHeightMm: item.file._boundingBox.heightMm,
						pieceAreaCm2: item.file._pieceAreaMm2! / 100,
						cutLengthMm: item.file._cutLength.totalMm,
						piercingCount: item.file._piercings.total,
						quantity: item.quantity,
					});

					if (!result.success) {
						throw new Error(result.error);
					}

					return {
						itemIndex: index,
						breakdown: result.breakdown,
					};
				})
			);

			return results.filter((r): r is PriceResult => r !== null);
		},
		enabled: items.length > 0 && items.some(
			(item) =>
				item.materialType &&
				item.file._cutLength &&
				item.file._piercings &&
				item.file._boundingBox &&
				item.file._pieceAreaMm2 != null
		),
		staleTime: 30 * 1000, // 30 seconds
	});
}
