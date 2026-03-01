'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import {
	calculatePrice,
	type PricingInput,
	type PricingBreakdown,
	type PricingConfigValues,
	type MaterialParams,
} from '@/lib/pricing-engine';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getPricingData() {
	const [fixedCosts, config, volumeDiscounts] = await Promise.all([
		prisma.fixedCost.findMany({ orderBy: { name: 'asc' } }),
		prisma.pricingConfig.findFirst({ where: { isActive: true } }),
		prisma.volumeDiscount.findMany({ orderBy: { minQuantity: 'asc' } }),
	]);

	return { fixedCosts, config, volumeDiscounts };
}

// ---------------------------------------------------------------------------
// FixedCost CRUD
// ---------------------------------------------------------------------------

export async function createFixedCost(data: {
	name: string;
	description?: string;
	monthlyCost: number;
}) {
	try {
		await requireAdmin();
		const fixedCost = await prisma.fixedCost.create({
			data: {
				name: data.name,
				description: data.description || null,
				monthlyCost: data.monthlyCost,
			},
		});
		revalidatePath('/pricing');
		return { success: true as const, fixedCost };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function updateFixedCost(
	id: string,
	data: { name?: string; description?: string; monthlyCost?: number }
) {
	try {
		await requireAdmin();
		const fixedCost = await prisma.fixedCost.update({
			where: { id },
			data,
		});
		revalidatePath('/pricing');
		return { success: true as const, fixedCost };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function deleteFixedCost(id: string) {
	try {
		await requireAdmin();
		await prisma.fixedCost.delete({ where: { id } });
		revalidatePath('/pricing');
		return { success: true as const };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function toggleFixedCost(id: string) {
	try {
		await requireAdmin();
		const existing = await prisma.fixedCost.findUnique({ where: { id } });
		if (!existing) return { success: false as const, error: 'No encontrado' };

		const updated = await prisma.fixedCost.update({
			where: { id },
			data: { isActive: !existing.isActive },
		});
		revalidatePath('/pricing');
		return { success: true as const, fixedCost: updated };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

// ---------------------------------------------------------------------------
// PricingConfig upsert
// ---------------------------------------------------------------------------

export async function upsertPricingConfig(data: {
	productiveHoursPerMonth: number;
	workingDaysPerMonth: number;
	machineEfficiency: number;
	maxKgPerShipment: number;
	usdToArsRate: number;
	machineValueUsd: number;
	amortizationYears: number;
	laserConsumptionKw: number;
	energyCostPerKwh: number;
	oxygenCostPerM3: number;
	nitrogenCostPerM3: number;
	lensCost: number;
	lensLifeHours: number;
	nozzleCost: number;
	nozzleLifeHours: number;
	programmingCostPerPiece: number;
	setupCostPerPiece: number;
	packagingCostPerShipment: number;
	dispatchCostPerOrder: number;
	shippingCostPerOrder: number;
	profitMargin: number;
	urgencySurcharge: number;
	materialWasteFactor: number;
	nestingSafetyMargin: number;
}) {
	try {
		await requireAdmin();

		const existing = await prisma.pricingConfig.findFirst({
			where: { isActive: true },
		});

		let config;
		if (existing) {
			config = await prisma.pricingConfig.update({
				where: { id: existing.id },
				data,
			});
		} else {
			config = await prisma.pricingConfig.create({
				data: { ...data, isActive: true },
			});
		}

		revalidatePath('/pricing');
		return { success: true as const, config };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

// ---------------------------------------------------------------------------
// VolumeDiscount CRUD
// ---------------------------------------------------------------------------

export async function createVolumeDiscount(data: {
	minQuantity: number;
	maxQuantity: number | null;
	discountPercentage: number;
}) {
	try {
		await requireAdmin();
		const discount = await prisma.volumeDiscount.create({
			data: {
				minQuantity: data.minQuantity,
				maxQuantity: data.maxQuantity,
				discountPercentage: data.discountPercentage,
			},
		});
		revalidatePath('/pricing');
		return { success: true as const, discount };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function updateVolumeDiscount(
	id: string,
	data: {
		minQuantity?: number;
		maxQuantity?: number | null;
		discountPercentage?: number;
	}
) {
	try {
		await requireAdmin();
		const discount = await prisma.volumeDiscount.update({
			where: { id },
			data,
		});
		revalidatePath('/pricing');
		return { success: true as const, discount };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function deleteVolumeDiscount(id: string) {
	try {
		await requireAdmin();
		await prisma.volumeDiscount.delete({ where: { id } });
		revalidatePath('/pricing');
		return { success: true as const };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

export async function toggleVolumeDiscount(id: string) {
	try {
		await requireAdmin();
		const existing = await prisma.volumeDiscount.findUnique({ where: { id } });
		if (!existing) return { success: false as const, error: 'No encontrado' };

		const updated = await prisma.volumeDiscount.update({
			where: { id },
			data: { isActive: !existing.isActive },
		});
		revalidatePath('/pricing');
		return { success: true as const, discount: updated };
	} catch (error: any) {
		return { success: false as const, error: error.message };
	}
}

// ---------------------------------------------------------------------------
// Quote price computation (called from quoting flow)
// ---------------------------------------------------------------------------

export async function computeQuotePrice(input: {
	materialTypeId: string;
	boundingBoxWidthMm: number;
	boundingBoxHeightMm: number;
	pieceAreaCm2: number;
	cutLengthMm: number;
	piercingCount: number;
	quantity: number;
	isUrgent?: boolean;
}): Promise<
	| { success: true; breakdown: PricingBreakdown }
	| { success: false; error: string }
> {
	try {
		// Fetch all required data in parallel
		const [materialType, config, fixedCosts, volumeDiscounts] =
			await Promise.all([
				prisma.materialType.findUnique({
					where: { id: input.materialTypeId },
					include: { material: true },
				}),
				prisma.pricingConfig.findFirst({ where: { isActive: true } }),
				prisma.fixedCost.findMany({ where: { isActive: true } }),
				prisma.volumeDiscount.findMany({
					where: { isActive: true },
					orderBy: { minQuantity: 'asc' },
				}),
			]);

		if (!materialType) {
			return { success: false, error: 'Tipo de material no encontrado' };
		}
		if (!config) {
			return {
				success: false,
				error: 'Configuración de precios no encontrada. Configure los parámetros en el panel de administración.',
			};
		}

		// Validate material has cutting parameters
		if (!materialType.cuttingSpeed || !materialType.assistGas || !materialType.gasConsumption || !materialType.piercingTime) {
			return {
				success: false,
				error: `El material "${materialType.material.name}" no tiene parámetros de corte configurados.`,
			};
		}

		// Find applicable volume discount
		let volumeDiscountRate = 0;
		for (const vd of volumeDiscounts) {
			if (
				input.quantity >= vd.minQuantity &&
				(vd.maxQuantity === null || input.quantity <= vd.maxQuantity)
			) {
				volumeDiscountRate = vd.discountPercentage;
			}
		}

		const totalFixedCostPerMonth = fixedCosts.reduce(
			(sum, fc) => sum + fc.monthlyCost,
			0
		);

		const materialParams: MaterialParams = {
			cuttingSpeed: materialType.cuttingSpeed,
			assistGas: materialType.assistGas,
			gasConsumption: materialType.gasConsumption,
			piercingTime: materialType.piercingTime,
			sheetWeight: materialType.sheetWeight ?? materialType.massPerUnit,
			pricePerUnit: materialType.pricePerUnit,
			sheetWidth: materialType.width,
			sheetLength: materialType.length,
		};

		const configValues: PricingConfigValues = {
			productiveHoursPerMonth: config.productiveHoursPerMonth,
			workingDaysPerMonth: config.workingDaysPerMonth,
			machineEfficiency: config.machineEfficiency,
			maxKgPerShipment: config.maxKgPerShipment,
			usdToArsRate: config.usdToArsRate,
			machineValueUsd: config.machineValueUsd,
			amortizationYears: config.amortizationYears,
			laserConsumptionKw: config.laserConsumptionKw,
			energyCostPerKwh: config.energyCostPerKwh,
			oxygenCostPerM3: config.oxygenCostPerM3,
			nitrogenCostPerM3: config.nitrogenCostPerM3,
			lensCost: config.lensCost,
			lensLifeHours: config.lensLifeHours,
			nozzleCost: config.nozzleCost,
			nozzleLifeHours: config.nozzleLifeHours,
			programmingCostPerPiece: config.programmingCostPerPiece,
			setupCostPerPiece: config.setupCostPerPiece,
			packagingCostPerShipment: config.packagingCostPerShipment,
			dispatchCostPerOrder: config.dispatchCostPerOrder,
			shippingCostPerOrder: config.shippingCostPerOrder,
			profitMargin: config.profitMargin,
			urgencySurcharge: config.urgencySurcharge,
			materialWasteFactor: config.materialWasteFactor,
			nestingSafetyMargin: config.nestingSafetyMargin,
		};

		const pricingInput: PricingInput = {
			material: materialParams,
			config: configValues,
			totalFixedCostPerMonth,
			boundingBoxWidthMm: input.boundingBoxWidthMm,
			boundingBoxHeightMm: input.boundingBoxHeightMm,
			pieceAreaCm2: input.pieceAreaCm2,
			cutLengthMm: input.cutLengthMm,
			piercingCount: input.piercingCount,
			quantity: input.quantity,
			volumeDiscountRate,
			isUrgent: input.isUrgent,
		};

		const breakdown = calculatePrice(pricingInput);
		return { success: true, breakdown };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
