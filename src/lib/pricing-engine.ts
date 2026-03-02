/**
 * Pricing Engine - Replicates all formulas from quoting_sheets.xlsx
 *
 * This is a pure calculation module with zero framework imports.
 * It accepts plain data and returns a detailed cost breakdown.
 *
 * calculatePrice()          → per-piece production costs (no logistics)
 * calculateOrderLogistics() → order-level logistics (packaging, dispatch, shipping)
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
	paymentCommission: number; // MercadoPago commission (e.g. 0.06 = 6%)

	// Waste
	materialWasteFactor: number;
	nestingSafetyMargin: number;

	// Free shipping
	freeShippingThreshold: number; // order subtotal above which shipping is free
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

	// Aggregates
	totalCostPerPiece: number;
	profitPerPiece: number;
	volumeDiscount: number; // negative value
	urgencySurchargeAmount: number;
	logisticsCostPerPiece: number; // per-kg logistics surcharge embedded in unit price
	paymentCommissionAmount: number;
	unitSalePrice: number;
	totalOrderPrice: number;

	// Metadata
	pieceWeightKg: number;
	sheetAreaCm2: number;
	pieceAreaCm2: number;
	monthlyAmortization: number;
	fixedCostPerMin: number;
	amortizationPerMin: number;
}

// ---------------------------------------------------------------------------
// Order-level logistics
// ---------------------------------------------------------------------------

export interface OrderLogisticsInput {
	totalOrderWeightKg: number;
	maxKgPerShipment: number;
	packagingCostPerShipment: number;
	dispatchCostPerOrder: number;
	shippingCostPerOrder: number;
	paymentCommission: number;
}

export interface OrderLogistics {
	totalOrderWeightKg: number;
	numberOfShipments: number;
	packagingCost: number;
	dispatchCost: number;
	shippingCost: number;
	logisticsSubtotal: number;
	logisticsCommission: number;
	logisticsTotal: number;
}

// ---------------------------------------------------------------------------
// Main calculation — per-piece production costs (no logistics)
// ---------------------------------------------------------------------------

export function calculatePrice(input: PricingInput): PricingBreakdown {
	const { material, config, totalFixedCostPerMonth } = input;

	// --- Step 1: Cutting time (minutes) ---
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

	// --- Step 13: Programming & Setup (amortized over quantity) ---
	const programmingCost =
		input.quantity > 0
			? config.programmingCostPerPiece / input.quantity
			: config.programmingCostPerPiece;
	const setupCost =
		input.quantity > 0
			? config.setupCostPerPiece / input.quantity
			: config.setupCostPerPiece;

	// --- Step 14: Piece weight ---
	const pieceWeightKg =
		sheetAreaCm2 > 0 && material.sheetWeight > 0
			? (pieceAreaCm2 / sheetAreaCm2) * material.sheetWeight
			: 0;

	// --- Step 14b: Logistics surcharge per piece (embedded in unit price) ---
	const logisticsCostPerKg =
		config.maxKgPerShipment > 0
			? (config.packagingCostPerShipment +
					config.dispatchCostPerOrder +
					config.shippingCostPerOrder) /
				config.maxKgPerShipment
			: 0;
	const logisticsCostPerPiece = pieceWeightKg * logisticsCostPerKg;

	// --- Step 15: Total cost per piece (production only) ---
	const totalCostPerPiece =
		gasCost +
		energyCost +
		consumablesCost +
		materialCost +
		fixedCostAllocation +
		amortizationCost +
		programmingCost +
		setupCost;

	// --- Step 16: Profit (margin on sale price) ---
	const profitPerPiece =
		config.profitMargin < 1
			? (totalCostPerPiece * config.profitMargin) /
				(1 - config.profitMargin)
			: 0;

	// --- Step 17: Volume discount ---
	const volumeDiscount =
		-(totalCostPerPiece + profitPerPiece) * input.volumeDiscountRate;

	// --- Step 18: Urgency surcharge ---
	const urgencySurchargeAmount = input.isUrgent
		? (totalCostPerPiece + profitPerPiece) * config.urgencySurcharge
		: 0;

	// --- Step 19: Subtotal before payment commission ---
	const subtotalPerPiece =
		totalCostPerPiece +
		profitPerPiece +
		volumeDiscount +
		urgencySurchargeAmount +
		logisticsCostPerPiece;

	// --- Step 20: Payment commission (MercadoPago) ---
	const unitSalePrice =
		config.paymentCommission < 1
			? subtotalPerPiece / (1 - config.paymentCommission)
			: subtotalPerPiece;
	const paymentCommissionAmount = unitSalePrice - subtotalPerPiece;

	// --- Step 21: Total order price (production only) ---
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
		totalCostPerPiece,
		profitPerPiece,
		volumeDiscount,
		urgencySurchargeAmount,
		logisticsCostPerPiece,
		paymentCommissionAmount,
		unitSalePrice,
		totalOrderPrice,
		pieceWeightKg,
		sheetAreaCm2,
		pieceAreaCm2,
		monthlyAmortization,
		fixedCostPerMin,
		amortizationPerMin,
	};
}

// ---------------------------------------------------------------------------
// Order-level logistics calculation
// ---------------------------------------------------------------------------

export function calculateOrderLogistics(
	input: OrderLogisticsInput,
): OrderLogistics {
	const {
		totalOrderWeightKg,
		maxKgPerShipment,
		packagingCostPerShipment,
		dispatchCostPerOrder,
		shippingCostPerOrder,
		paymentCommission,
	} = input;

	const numberOfShipments =
		totalOrderWeightKg > 0 && maxKgPerShipment > 0
			? Math.ceil(totalOrderWeightKg / maxKgPerShipment)
			: 1;

	const packagingCost = numberOfShipments * packagingCostPerShipment;
	const dispatchCost = numberOfShipments * dispatchCostPerOrder;
	const shippingCost = numberOfShipments * shippingCostPerOrder;

	const logisticsSubtotal = packagingCost + dispatchCost + shippingCost;

	// Apply payment commission to logistics as well
	const logisticsTotal =
		paymentCommission < 1
			? logisticsSubtotal / (1 - paymentCommission)
			: logisticsSubtotal;
	const logisticsCommission = logisticsTotal - logisticsSubtotal;

	return {
		totalOrderWeightKg,
		numberOfShipments,
		packagingCost,
		dispatchCost,
		shippingCost,
		logisticsSubtotal,
		logisticsCommission,
		logisticsTotal,
	};
}
