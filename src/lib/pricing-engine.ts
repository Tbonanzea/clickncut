/**
 * Pricing Engine - Replicates all formulas from quoting_sheets.xlsx
 *
 * This is a pure calculation module with zero framework imports.
 * It accepts plain data and returns a detailed cost breakdown.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface MaterialParams {
	cuttingSpeed: number; // mm/min
	assistGas: string; // "Oxigeno" | "Nitrogeno"
	gasConsumption: number; // L/min
	piercingTime: number; // seconds per piercing
	sheetWeight: number; // kg per sheet
	pricePerUnit: number; // $ per sheet (raw material cost)
	sheetWidth: number; // mm
	sheetLength: number; // mm
}

export interface PricingConfigValues {
	// Production
	productiveHoursPerMonth: number;
	workingDaysPerMonth: number;
	machineEfficiency: number;
	maxKgPerShipment: number;

	// Currency & amortization
	usdToArsRate: number;
	machineValueUsd: number;
	amortizationYears: number;

	// Energy
	laserConsumptionKw: number;
	energyCostPerKwh: number;

	// Gas
	oxygenCostPerM3: number;
	nitrogenCostPerM3: number;

	// Consumables
	lensCost: number;
	lensLifeHours: number;
	nozzleCost: number;
	nozzleLifeHours: number;

	// Services
	programmingCostPerPiece: number;
	setupCostPerPiece: number;

	// Logistics
	packagingCostPerShipment: number;
	dispatchCostPerOrder: number;
	shippingCostPerOrder: number;

	// Margins
	profitMargin: number;
	urgencySurcharge: number;

	// Waste
	materialWasteFactor: number;
	nestingSafetyMargin: number;
}

export interface PricingInput {
	material: MaterialParams;
	config: PricingConfigValues;
	totalFixedCostPerMonth: number; // Sum of all active FixedCost.monthlyCost

	// From DXF geometry (client-side)
	boundingBoxWidthMm: number;
	boundingBoxHeightMm: number;
	pieceAreaCm2: number; // Real piece area from contour chaining
	cutLengthMm: number;
	piercingCount: number;

	// Order context
	quantity: number;
	volumeDiscountRate: number; // 0-1 fraction, e.g. 0.10 for 10%
	isUrgent?: boolean;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface PricingBreakdown {
	// Time calculations
	cuttingTimeMin: number;
	piercingTimeMin: number;
	totalCuttingTimeMin: number;

	// Cost components per piece ($)
	gasCost: number;
	energyCost: number;
	consumablesCost: number;
	materialCost: number;
	fixedCostAllocation: number;
	amortizationCost: number;
	programmingCost: number;
	setupCost: number;
	packagingCost: number;
	dispatchCost: number;
	shippingCost: number;

	// Aggregates
	totalCostPerPiece: number;
	profitPerPiece: number;
	volumeDiscount: number; // negative value
	urgencySurchargeAmount: number;
	unitSalePrice: number;
	totalOrderPrice: number;

	// Metadata
	totalOrderWeightKg: number;
	numberOfShipments: number;
	sheetAreaCm2: number;
	pieceAreaCm2: number;
	monthlyAmortization: number;
	fixedCostPerMin: number;
	amortizationPerMin: number;
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

export function calculatePrice(input: PricingInput): PricingBreakdown {
	const { material, config, totalFixedCostPerMonth } = input;

	// --- Step 1: Cutting time (minutes) ---
	// linearCutCm * 10 / cuttingSpeed = cutLengthMm / cuttingSpeed
	const cuttingTimeMin =
		material.cuttingSpeed > 0
			? input.cutLengthMm / material.cuttingSpeed
			: 0;

	// --- Step 2: Piercing time (minutes) ---
	const piercingTimeMin = (input.piercingCount * material.piercingTime) / 60;

	// --- Step 3: Total cutting time ---
	const totalCuttingTimeMin = cuttingTimeMin + piercingTimeMin;

	// --- Step 4: Gas cost ---
	const gasCostPerM3 =
		material.assistGas === 'Oxigeno'
			? config.oxygenCostPerM3
			: config.nitrogenCostPerM3;
	const gasCost =
		(totalCuttingTimeMin * material.gasConsumption * gasCostPerM3) / 1000;

	// --- Step 5: Energy cost ---
	const energyCost =
		(totalCuttingTimeMin / 60) *
		config.laserConsumptionKw *
		config.energyCostPerKwh;

	// --- Step 6: Consumables cost ---
	const lensCostPerHour =
		config.lensLifeHours > 0 ? config.lensCost / config.lensLifeHours : 0;
	const nozzleCostPerHour =
		config.nozzleLifeHours > 0
			? config.nozzleCost / config.nozzleLifeHours
			: 0;
	const consumablesCost =
		(totalCuttingTimeMin / 60) * (lensCostPerHour + nozzleCostPerHour);

	// --- Step 7: Piece area (cm²) — real area from contour chaining ---
	const pieceAreaCm2 = input.pieceAreaCm2;

	// --- Step 8: Sheet area (cm²) ---
	const sheetAreaCm2 = (material.sheetWidth * material.sheetLength) / 100;

	// --- Step 9: Material cost per piece ---
	const materialCost =
		sheetAreaCm2 > 0
			? (pieceAreaCm2 / sheetAreaCm2) *
				material.pricePerUnit *
				(1 + config.materialWasteFactor)
			: 0;

	// --- Step 10: Fixed cost per minute ---
	const fixedCostPerMin =
		config.productiveHoursPerMonth > 0 && config.machineEfficiency > 0
			? totalFixedCostPerMonth /
				config.productiveHoursPerMonth /
				60 /
				config.machineEfficiency
			: 0;

	// --- Step 11: Machine amortization per minute ---
	const monthlyAmortization =
		config.amortizationYears > 0
			? (config.machineValueUsd * config.usdToArsRate) /
				config.amortizationYears /
				12
			: 0;
	const amortizationPerMin =
		config.productiveHoursPerMonth > 0 && config.machineEfficiency > 0
			? monthlyAmortization /
				config.productiveHoursPerMonth /
				60 /
				config.machineEfficiency
			: 0;

	// --- Step 12: Imputed fixed costs ---
	const fixedCostAllocation = totalCuttingTimeMin * fixedCostPerMin;
	const amortizationCost = totalCuttingTimeMin * amortizationPerMin;

	// --- Step 13: Programming & Setup ---
	const programmingCost = config.programmingCostPerPiece;
	const setupCost = config.setupCostPerPiece;

	// --- Step 14: Order weight & shipments ---
	const totalOrderWeightKg =
		sheetAreaCm2 > 0 && material.sheetWeight > 0
			? (pieceAreaCm2 / sheetAreaCm2) *
				material.sheetWeight *
				(1 + config.materialWasteFactor) *
				input.quantity
			: 0;
	const numberOfShipments =
		totalOrderWeightKg > 0 && config.maxKgPerShipment > 0
			? Math.ceil(totalOrderWeightKg / config.maxKgPerShipment)
			: 1;

	// --- Step 15: Logistics per piece ---
	const packagingCost =
		(numberOfShipments * config.packagingCostPerShipment) / input.quantity;
	const dispatchCost =
		(numberOfShipments * config.dispatchCostPerOrder) / input.quantity;
	const shippingCost =
		(numberOfShipments * config.shippingCostPerOrder) / input.quantity;

	// --- Step 16: Total cost per piece ---
	const totalCostPerPiece =
		gasCost +
		energyCost +
		consumablesCost +
		materialCost +
		fixedCostAllocation +
		amortizationCost +
		programmingCost +
		setupCost +
		packagingCost +
		dispatchCost +
		shippingCost;

	// --- Step 17: Profit ---
	const profitPerPiece = totalCostPerPiece * config.profitMargin;

	// --- Step 18: Volume discount ---
	const volumeDiscount =
		-(totalCostPerPiece + profitPerPiece) * input.volumeDiscountRate;

	// --- Step 19: Urgency surcharge ---
	const urgencySurchargeAmount = input.isUrgent
		? (totalCostPerPiece + profitPerPiece) * config.urgencySurcharge
		: 0;

	// --- Step 20: Unit sale price ---
	const unitSalePrice =
		totalCostPerPiece +
		profitPerPiece +
		volumeDiscount +
		urgencySurchargeAmount;

	// --- Step 21: Total order price ---
	const totalOrderPrice = unitSalePrice * input.quantity;

	return {
		cuttingTimeMin,
		piercingTimeMin,
		totalCuttingTimeMin,
		gasCost,
		energyCost,
		consumablesCost,
		materialCost,
		fixedCostAllocation,
		amortizationCost,
		programmingCost,
		setupCost,
		packagingCost,
		dispatchCost,
		shippingCost,
		totalCostPerPiece,
		profitPerPiece,
		volumeDiscount,
		urgencySurchargeAmount,
		unitSalePrice,
		totalOrderPrice,
		totalOrderWeightKg,
		numberOfShipments,
		sheetAreaCm2,
		pieceAreaCm2,
		monthlyAmortization,
		fixedCostPerMin,
		amortizationPerMin,
	};
}
