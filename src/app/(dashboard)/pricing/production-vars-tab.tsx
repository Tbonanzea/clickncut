'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Save,
	Factory,
	DollarSign,
	Zap,
	Wind,
	Disc,
	Wrench,
	Truck,
	Trash2,
} from 'lucide-react';
import { upsertPricingConfig } from './actions';

interface PricingConfig {
	id: string;
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
}

const defaults: Omit<PricingConfig, 'id'> = {
	productiveHoursPerMonth: 176,
	workingDaysPerMonth: 22,
	machineEfficiency: 0.75,
	maxKgPerShipment: 15,
	usdToArsRate: 1200,
	machineValueUsd: 25000,
	amortizationYears: 5,
	laserConsumptionKw: 0.8,
	energyCostPerKwh: 120,
	oxygenCostPerM3: 8000,
	nitrogenCostPerM3: 12000,
	lensCost: 15000,
	lensLifeHours: 10,
	nozzleCost: 8000,
	nozzleLifeHours: 10,
	programmingCostPerPiece: 500,
	setupCostPerPiece: 300,
	packagingCostPerShipment: 200,
	dispatchCostPerOrder: 500,
	shippingCostPerOrder: 1500,
	profitMargin: 0.35,
	urgencySurcharge: 0.50,
	materialWasteFactor: 0.15,
	nestingSafetyMargin: 0.05,
};

interface ProductionVarsTabProps {
	config: PricingConfig | null;
}

function Field({
	label,
	value,
	onChange,
	suffix,
	step,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	suffix?: string;
	step?: string;
}) {
	return (
		<div className='space-y-1.5'>
			<Label className='text-xs font-medium text-muted-foreground'>
				{label}
			</Label>
			<div className='flex items-center gap-1.5'>
				<Input
					type='number'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					step={step}
					className='font-mono h-9 text-sm'
				/>
				{suffix && (
					<span className='text-xs text-muted-foreground whitespace-nowrap min-w-fit'>
						{suffix}
					</span>
				)}
			</div>
		</div>
	);
}

function DerivedValue({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className='flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/10 rounded-md'>
			<span className='text-xs text-muted-foreground'>{label}</span>
			<span className='text-sm font-semibold font-mono'>{value}</span>
		</div>
	);
}

function formatARS(value: number): string {
	return (
		'$' +
		value.toLocaleString('es-AR', {
			maximumFractionDigits: 0,
		})
	);
}

export function ProductionVarsTab({ config }: ProductionVarsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(false);

	const initial = config || defaults;

	// Store percentages as display values (e.g. 75 not 0.75)
	const [form, setForm] = useState({
		productiveHoursPerMonth: initial.productiveHoursPerMonth.toString(),
		workingDaysPerMonth: initial.workingDaysPerMonth.toString(),
		machineEfficiency: (initial.machineEfficiency * 100).toString(),
		maxKgPerShipment: initial.maxKgPerShipment.toString(),
		usdToArsRate: initial.usdToArsRate.toString(),
		machineValueUsd: initial.machineValueUsd.toString(),
		amortizationYears: initial.amortizationYears.toString(),
		laserConsumptionKw: initial.laserConsumptionKw.toString(),
		energyCostPerKwh: initial.energyCostPerKwh.toString(),
		oxygenCostPerM3: initial.oxygenCostPerM3.toString(),
		nitrogenCostPerM3: initial.nitrogenCostPerM3.toString(),
		lensCost: initial.lensCost.toString(),
		lensLifeHours: initial.lensLifeHours.toString(),
		nozzleCost: initial.nozzleCost.toString(),
		nozzleLifeHours: initial.nozzleLifeHours.toString(),
		programmingCostPerPiece: initial.programmingCostPerPiece.toString(),
		setupCostPerPiece: initial.setupCostPerPiece.toString(),
		packagingCostPerShipment: initial.packagingCostPerShipment.toString(),
		dispatchCostPerOrder: initial.dispatchCostPerOrder.toString(),
		shippingCostPerOrder: initial.shippingCostPerOrder.toString(),
		materialWasteFactor: (initial.materialWasteFactor * 100).toString(),
		nestingSafetyMargin: (initial.nestingSafetyMargin * 100).toString(),
	});

	const updateField = (key: keyof typeof form) => (value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	};

	const handleSave = () => {
		startTransition(async () => {
			const data = {
				productiveHoursPerMonth: parseFloat(form.productiveHoursPerMonth),
				workingDaysPerMonth: parseFloat(form.workingDaysPerMonth),
				machineEfficiency: parseFloat(form.machineEfficiency) / 100,
				maxKgPerShipment: parseFloat(form.maxKgPerShipment),
				usdToArsRate: parseFloat(form.usdToArsRate),
				machineValueUsd: parseFloat(form.machineValueUsd),
				amortizationYears: parseFloat(form.amortizationYears),
				laserConsumptionKw: parseFloat(form.laserConsumptionKw),
				energyCostPerKwh: parseFloat(form.energyCostPerKwh),
				oxygenCostPerM3: parseFloat(form.oxygenCostPerM3),
				nitrogenCostPerM3: parseFloat(form.nitrogenCostPerM3),
				lensCost: parseFloat(form.lensCost),
				lensLifeHours: parseFloat(form.lensLifeHours),
				nozzleCost: parseFloat(form.nozzleCost),
				nozzleLifeHours: parseFloat(form.nozzleLifeHours),
				programmingCostPerPiece: parseFloat(form.programmingCostPerPiece),
				setupCostPerPiece: parseFloat(form.setupCostPerPiece),
				packagingCostPerShipment: parseFloat(form.packagingCostPerShipment),
				dispatchCostPerOrder: parseFloat(form.dispatchCostPerOrder),
				shippingCostPerOrder: parseFloat(form.shippingCostPerOrder),
				profitMargin: config?.profitMargin ?? defaults.profitMargin,
				urgencySurcharge: config?.urgencySurcharge ?? defaults.urgencySurcharge,
				materialWasteFactor: parseFloat(form.materialWasteFactor) / 100,
				nestingSafetyMargin: parseFloat(form.nestingSafetyMargin) / 100,
			};

			const result = await upsertPricingConfig(data);
			if (!result.success) {
				setError(result.error);
				setSaved(false);
			} else {
				setError('');
				setSaved(true);
			}
		});
	};

	// Derived values
	const monthlyAmort =
		parseFloat(form.amortizationYears) > 0
			? (parseFloat(form.machineValueUsd) *
					parseFloat(form.usdToArsRate)) /
				parseFloat(form.amortizationYears) /
				12
			: 0;
	const lensCostPerHour =
		parseFloat(form.lensLifeHours) > 0
			? parseFloat(form.lensCost) / parseFloat(form.lensLifeHours)
			: 0;
	const nozzleCostPerHour =
		parseFloat(form.nozzleLifeHours) > 0
			? parseFloat(form.nozzleCost) / parseFloat(form.nozzleLifeHours)
			: 0;
	const effectiveHours =
		parseFloat(form.productiveHoursPerMonth) *
		(parseFloat(form.machineEfficiency) / 100);

	return (
		<div className='space-y-4'>
			{error && (
				<div className='p-3 bg-destructive/10 text-destructive text-sm rounded-md'>
					{error}
				</div>
			)}
			{saved && (
				<div className='p-3 bg-green-500/10 text-green-700 text-sm rounded-md'>
					Configuración guardada correctamente
				</div>
			)}

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				{/* Producción */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Factory className='h-4 w-4 text-muted-foreground' />
							Producción
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Horas productivas / mes'
								value={form.productiveHoursPerMonth}
								onChange={updateField('productiveHoursPerMonth')}
								suffix='hrs'
							/>
							<Field
								label='Días laborales / mes'
								value={form.workingDaysPerMonth}
								onChange={updateField('workingDaysPerMonth')}
								suffix='días'
							/>
							<Field
								label='Eficiencia de máquina'
								value={form.machineEfficiency}
								onChange={updateField('machineEfficiency')}
								suffix='%'
								step='1'
							/>
							<Field
								label='Peso máx. por envío'
								value={form.maxKgPerShipment}
								onChange={updateField('maxKgPerShipment')}
								suffix='kg'
							/>
						</div>
						<DerivedValue
							label='Horas efectivas / mes'
							value={`${effectiveHours.toFixed(0)} hrs`}
						/>
					</CardContent>
				</Card>

				{/* Moneda y Amortización */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<DollarSign className='h-4 w-4 text-muted-foreground' />
							Moneda y Amortización
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Tipo de cambio USD → ARS'
								value={form.usdToArsRate}
								onChange={updateField('usdToArsRate')}
								suffix='$/USD'
							/>
							<Field
								label='Valor máquina'
								value={form.machineValueUsd}
								onChange={updateField('machineValueUsd')}
								suffix='USD'
							/>
							<Field
								label='Años de amortización'
								value={form.amortizationYears}
								onChange={updateField('amortizationYears')}
								suffix='años'
							/>
						</div>
						<DerivedValue
							label='Amortización mensual'
							value={formatARS(monthlyAmort)}
						/>
					</CardContent>
				</Card>

				{/* Energía */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Zap className='h-4 w-4 text-muted-foreground' />
							Energía
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Consumo láser'
								value={form.laserConsumptionKw}
								onChange={updateField('laserConsumptionKw')}
								suffix='kW'
								step='0.1'
							/>
							<Field
								label='Costo energía'
								value={form.energyCostPerKwh}
								onChange={updateField('energyCostPerKwh')}
								suffix='$/kWh'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Gas */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Wind className='h-4 w-4 text-muted-foreground' />
							Gas Asistente
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Costo oxígeno'
								value={form.oxygenCostPerM3}
								onChange={updateField('oxygenCostPerM3')}
								suffix='$/m³'
							/>
							<Field
								label='Costo nitrógeno'
								value={form.nitrogenCostPerM3}
								onChange={updateField('nitrogenCostPerM3')}
								suffix='$/m³'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Consumibles */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Disc className='h-4 w-4 text-muted-foreground' />
							Consumibles
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Costo lente'
								value={form.lensCost}
								onChange={updateField('lensCost')}
								suffix='$'
							/>
							<Field
								label='Vida útil lente'
								value={form.lensLifeHours}
								onChange={updateField('lensLifeHours')}
								suffix='hrs'
							/>
							<Field
								label='Costo boquilla'
								value={form.nozzleCost}
								onChange={updateField('nozzleCost')}
								suffix='$'
							/>
							<Field
								label='Vida útil boquilla'
								value={form.nozzleLifeHours}
								onChange={updateField('nozzleLifeHours')}
								suffix='hrs'
							/>
						</div>
						<DerivedValue
							label='Costo consumibles / hora'
							value={`${formatARS(lensCostPerHour + nozzleCostPerHour)} (lente: ${formatARS(lensCostPerHour)} + boquilla: ${formatARS(nozzleCostPerHour)})`}
						/>
					</CardContent>
				</Card>

				{/* Servicios */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Wrench className='h-4 w-4 text-muted-foreground' />
							Servicios por Pieza
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Programación CAD/CAM'
								value={form.programmingCostPerPiece}
								onChange={updateField('programmingCostPerPiece')}
								suffix='$/pieza'
							/>
							<Field
								label='Setup y calibración'
								value={form.setupCostPerPiece}
								onChange={updateField('setupCostPerPiece')}
								suffix='$/pieza'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Logística */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Truck className='h-4 w-4 text-muted-foreground' />
							Logística
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-3 gap-3'>
							<Field
								label='Embalaje'
								value={form.packagingCostPerShipment}
								onChange={updateField('packagingCostPerShipment')}
								suffix='$/envío'
							/>
							<Field
								label='Despacho'
								value={form.dispatchCostPerOrder}
								onChange={updateField('dispatchCostPerOrder')}
								suffix='$/pedido'
							/>
							<Field
								label='Flete'
								value={form.shippingCostPerOrder}
								onChange={updateField('shippingCostPerOrder')}
								suffix='$/pedido'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Desperdicio */}
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-sm font-medium flex items-center gap-2'>
							<Trash2 className='h-4 w-4 text-muted-foreground' />
							Desperdicio
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-3'>
							<Field
								label='Factor desperdicio material'
								value={form.materialWasteFactor}
								onChange={updateField('materialWasteFactor')}
								suffix='%'
								step='1'
							/>
							<Field
								label='Margen seguridad nesting'
								value={form.nestingSafetyMargin}
								onChange={updateField('nestingSafetyMargin')}
								suffix='%'
								step='1'
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='flex justify-end pt-2'>
				<Button onClick={handleSave} disabled={isPending}>
					<Save className='mr-2 h-4 w-4' />
					{isPending ? 'Guardando...' : 'Guardar Configuración'}
				</Button>
			</div>
		</div>
	);
}
