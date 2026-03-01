'use client';

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface FormulaRow {
	step: number;
	name: string;
	description: string;
	formula: string;
	code: string;
}

const formulas: FormulaRow[] = [
	{
		step: 1,
		name: 'Tiempo de corte',
		description:
			'Cuánto tarda el láser en recorrer todo el contorno de la pieza. Se divide el largo total de corte del DXF por la velocidad de corte del material/espesor.',
		formula: 'Largo de corte (mm) / Velocidad de corte (mm/min)',
		code: 'cutLengthMm / cuttingSpeed',
	},
	{
		step: 2,
		name: 'Tiempo de perforación',
		description:
			'Cada vez que el láser empieza un corte nuevo necesita perforar la chapa. Se multiplica la cantidad de perforaciones por el tiempo que tarda cada una.',
		formula: '(Cant. perforaciones × Tiempo perforación) / 60',
		code: '(piercingCount × piercingTime) / 60',
	},
	{
		step: 3,
		name: 'Tiempo total de corte',
		description:
			'Suma del tiempo cortando más el tiempo perforando. Se usa para calcular todos los costos variables.',
		formula: 'Tiempo de corte + Tiempo de perforación',
		code: 'cuttingTimeMin + piercingTimeMin',
	},
	{
		step: 4,
		name: 'Costo de gas',
		description:
			'El láser usa gas asistente (O₂ o N₂) mientras corta. Se calcula el consumo en el tiempo total y se multiplica por el precio del gas.',
		formula: 'T. total × Consumo gas × Precio gas / 1000',
		code: 'totalTime × gasConsumption × gasCostPerM3 / 1000',
	},
	{
		step: 5,
		name: 'Costo de energía',
		description:
			'Electricidad que consume el láser mientras corta. Se convierte el tiempo a horas y se multiplica por consumo × precio kWh.',
		formula: '(T. total / 60) × Consumo kW × $/kWh',
		code: '(totalTime / 60) × laserKw × energyCostPerKwh',
	},
	{
		step: 6,
		name: 'Costo de consumibles',
		description:
			'Lentes y boquillas se desgastan. Se calcula el costo por hora de cada uno y se multiplica por el tiempo de corte.',
		formula: '(T. total / 60) × (Lente/h + Boquilla/h)',
		code: '(totalTime / 60) × (lensCost/lensHrs + nozzleCost/nozzleHrs)',
	},
	{
		step: 7,
		name: 'Área de la pieza',
		description:
			'Área del bounding box del DXF en cm². Sirve para calcular qué proporción de chapa ocupa.',
		formula: '(Ancho bbox × Alto bbox) / 100',
		code: '(bbWidthMm × bbHeightMm) / 100',
	},
	{
		step: 8,
		name: 'Área de la chapa',
		description: 'Área total de una chapa entera en cm².',
		formula: '(Ancho chapa × Largo chapa) / 100',
		code: '(sheetWidth × sheetLength) / 100',
	},
	{
		step: 9,
		name: 'Costo de material',
		description:
			'Fracción de chapa que usa la pieza × precio de la chapa, con un % extra por desperdicio.',
		formula: '(Área pieza / Área chapa) × Precio × (1 + Desperdicio)',
		code: '(pieceArea / sheetArea) × price × (1 + wasteFactor)',
	},
	{
		step: 10,
		name: 'Costos fijos / minuto',
		description:
			'Los gastos fijos mensuales (alquiler, sueldos, etc.) repartidos entre los minutos productivos reales.',
		formula: 'Costos fijos mes / (Hrs prod. × 60 × Eficiencia)',
		code: 'fixedCosts / (prodHours × 60 × efficiency)',
	},
	{
		step: 11,
		name: 'Amortización / minuto',
		description:
			'El valor de la máquina amortizado en cuotas mensuales, repartido entre los minutos productivos.',
		formula: '(Máq. USD × TC / Años / 12) / (Hrs × 60 × Efic.)',
		code: '(machUsd × rate / years / 12) / (hrs × 60 × eff)',
	},
	{
		step: 12,
		name: 'Costos imputados',
		description:
			'Tiempo total × (costo fijo/min + amortización/min). Cada pieza absorbe su parte proporcional.',
		formula: 'T. total × (Fijo/min + Amort./min)',
		code: 'totalTime × (fixedPerMin + amortPerMin)',
	},
	{
		step: 13,
		name: 'Programación y setup',
		description:
			'Costo fijo por pieza: preparación del programa CAD/CAM + calibración de máquina.',
		formula: 'Programación + Setup',
		code: 'programmingCost + setupCost',
	},
	{
		step: 14,
		name: 'Peso y envíos',
		description:
			'Peso estimado del pedido. Si supera el máximo por envío, se divide en varios.',
		formula: 'Peso pieza × Cant. → ceil(Peso / Máx kg)',
		code: 'weight = pieceWt × qty; shipments = ceil(wt / maxKg)',
	},
	{
		step: 15,
		name: 'Logística / pieza',
		description:
			'Embalaje + despacho + flete, multiplicado por cantidad de envíos y dividido entre las piezas.',
		formula: 'Envíos × (Embal. + Desp. + Flete) / Cant.',
		code: 'ships × (pack + dispatch + ship) / qty',
	},
	{
		step: 16,
		name: 'Costo total / pieza',
		description:
			'Suma de todos los costos: gas + energía + consumibles + material + fijos + amortización + servicios + logística.',
		formula: 'Σ todos los costos anteriores',
		code: 'gas + energy + consum + mat + fixed + amort + prog + setup + pack + disp + ship',
	},
	{
		step: 17,
		name: 'Ganancia',
		description:
			'Margen de ganancia aplicado sobre el costo total (ej: 35% del costo).',
		formula: 'Costo total × Margen %',
		code: 'totalCost × profitMargin',
	},
	{
		step: 18,
		name: 'Descuento volumen',
		description:
			'Si la cantidad cae en un rango con descuento, se aplica sobre (costo + ganancia). Valor negativo.',
		formula: '-(Costo + Ganancia) × % Descuento',
		code: '-(totalCost + profit) × discountRate',
	},
	{
		step: 19,
		name: 'Recargo urgencia',
		description:
			'Si es urgente (<24h), recargo porcentual sobre (costo + ganancia).',
		formula: '(Costo + Ganancia) × Recargo %',
		code: '(totalCost + profit) × urgencySurcharge',
	},
	{
		step: 20,
		name: 'Precio unitario',
		description:
			'Precio final por pieza: costo + ganancia - descuento + urgencia.',
		formula: 'Costo + Ganancia + Desc. + Urgencia',
		code: 'totalCost + profit + discount + urgency',
	},
	{
		step: 21,
		name: 'Precio total',
		description: 'Precio unitario multiplicado por la cantidad de piezas.',
		formula: 'Precio unit. × Cantidad',
		code: 'unitPrice × quantity',
	},
];

export function FormulasTab() {
	return (
		<div className='space-y-4'>
			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-sm font-medium flex items-center gap-2'>
						<Calculator className='h-4 w-4 text-muted-foreground' />
						Motor de Cotización — Tabla de Fórmulas
					</CardTitle>
					<p className='text-xs text-muted-foreground'>
						Cada fila es un paso del cálculo automático de cotización.
						Se ejecutan en orden usando los valores de las otras pestañas.
					</p>
				</CardHeader>
				<CardContent className='pt-0 space-y-2'>
					{formulas.map((f) => (
						<div
							key={f.step}
							className='flex gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors'
						>
							{/* Step number */}
							<div className='flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
								<span className='text-xs font-bold text-muted-foreground'>
									{f.step}
								</span>
							</div>

							{/* Content */}
							<div className='flex-1 min-w-0 space-y-1.5'>
								<div className='flex items-baseline gap-2'>
									<span className='font-medium text-sm'>
										{f.name}
									</span>
									<span className='text-xs text-muted-foreground hidden sm:inline'>
										— {f.description}
									</span>
								</div>
								<p className='text-xs text-muted-foreground sm:hidden'>
									{f.description}
								</p>
								<div className='flex flex-col sm:flex-row gap-1.5 sm:gap-3'>
									<div className='flex items-center gap-1.5'>
										<span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-none'>
											Fórmula
										</span>
										<span className='text-xs font-mono bg-muted/50 px-2 py-0.5 rounded'>
											{f.formula}
										</span>
									</div>
									<div className='flex items-center gap-1.5'>
										<span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-none'>
											Código
										</span>
										<code className='text-xs font-mono bg-primary/5 text-primary px-2 py-0.5 rounded'>
											{f.code}
										</code>
									</div>
								</div>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
