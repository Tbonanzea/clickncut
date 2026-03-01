'use client';

import { MaterialWithTypes } from '@/app/actions/materials';
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuotingCartItem } from '@/context/quotingContext';
import type { PricingBreakdown } from '@/lib/pricing-engine';
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	Ruler,
	Scissors,
	Target,
	Trash2,
	Weight,
} from 'lucide-react';
import DXFViewerToggle from './DXFViewerToggle';

interface MaterialSelectionCardProps {
	item: QuotingCartItem;
	index: number;
	materials: MaterialWithTypes[];
	onMaterialChange: (index: number, materialId: string) => void;
	onMaterialTypeChange: (
		index: number,
		materialId: string,
		typeId: string,
	) => void;
	onQuantityChange: (index: number, quantity: number) => void;
	onRemove: (index: number) => void;
	breakdown?: PricingBreakdown;
	loadingPrice?: boolean;
}

function formatARS(value: number): string {
	return (
		'$' +
		value.toLocaleString('es-AR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	);
}

export default function MaterialSelectionCard({
	item,
	index,
	materials,
	onMaterialChange,
	onMaterialTypeChange,
	onQuantityChange,
	onRemove,
	breakdown,
	loadingPrice,
}: MaterialSelectionCardProps) {
	const isComplete = item.material && item.materialType && item.quantity > 0;
	const selectedMaterial = materials.find((m) => m.id === item.material?.id);

	// Check if piece fits within material cut limits
	const sizeWarnings: string[] = [];
	if (item.materialType && item.file._boundingBox) {
		const bb = item.file._boundingBox;
		const mt = item.materialType;
		if (mt.maxCutWidth > 0 && bb.widthMm > mt.maxCutWidth) {
			sizeWarnings.push(
				`Ancho de pieza (${bb.widthMm.toFixed(1)}mm) excede el máximo de corte (${mt.maxCutWidth}mm)`,
			);
		}
		if (mt.maxCutLength > 0 && bb.heightMm > mt.maxCutLength) {
			sizeWarnings.push(
				`Alto de pieza (${bb.heightMm.toFixed(1)}mm) excede el máximo de corte (${mt.maxCutLength}mm)`,
			);
		}
		if (mt.minCutWidth > 0 && bb.widthMm < mt.minCutWidth) {
			sizeWarnings.push(
				`Ancho de pieza (${bb.widthMm.toFixed(1)}mm) menor al mínimo de corte (${mt.minCutWidth}mm)`,
			);
		}
		if (mt.minCutLength > 0 && bb.heightMm < mt.minCutLength) {
			sizeWarnings.push(
				`Alto de pieza (${bb.heightMm.toFixed(1)}mm) menor al mínimo de corte (${mt.minCutLength}mm)`,
			);
		}
		// Also check piece fits within sheet dimensions
		if (bb.widthMm > mt.width || bb.heightMm > mt.length) {
			// Try rotated fit
			if (bb.widthMm > mt.length || bb.heightMm > mt.width) {
				sizeWarnings.push(
					`La pieza (${bb.widthMm.toFixed(1)}×${bb.heightMm.toFixed(1)}mm) no cabe en la chapa (${mt.width}×${mt.length}mm)`,
				);
			}
		}
	}

	return (
		<AccordionItem
			value={`item-${index}`}
			className='border rounded-lg mb-4'
		>
			<div className='flex items-center [&>:first-child]:flex-1'>
				<AccordionTrigger className='flex-1 px-4 hover:no-underline hover:bg-muted/50'>
					<div className='flex items-center gap-3 w-full'>
						{isComplete && sizeWarnings.length === 0 ? (
							<CheckCircle2 className='h-5 w-5 text-success shrink-0' />
						) : (
							<AlertCircle
								className={`h-5 w-5 shrink-0 ${sizeWarnings.length > 0 ? 'text-destructive' : 'text-warning'}`}
							/>
						)}
						<div className='flex-1 text-left'>
							<p className='font-semibold'>{item.file.filename}</p>
							{item.material && item.materialType ? (
								<p className='text-sm text-muted-foreground'>
									{item.material.name} -{' '}
									{item.materialType.height}mm
									{item.materialType.finish &&
										` (${item.materialType.finish})`}
									{item.quantity > 1 && ` × ${item.quantity}`}
									{breakdown && (
										<span className='ml-2 text-success font-medium'>
											{formatARS(breakdown.totalOrderPrice)}
										</span>
									)}
								</p>
							) : (
								<p className='text-sm text-warning'>
									Selecciona material y espesor
								</p>
							)}
						</div>
					</div>
				</AccordionTrigger>
				<button
					type='button'
					onClick={() => onRemove(index)}
					className='flex items-center gap-1.5 p-2 mr-2 rounded-md text-destructive text-sm hover:bg-destructive/10 transition-colors shrink-0'
					title='Eliminar archivo'
				>
					<Trash2 className='h-4 w-4' />
					<span className='hidden sm:inline'>Eliminar</span>
				</button>
			</div>
			<AccordionContent className='px-4'>
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4'>
					{/* Left: DXF Viewer */}
					<div className='flex flex-col'>
						<h4 className='text-sm font-medium mb-3'>
							Vista previa
						</h4>
						<DXFViewerToggle
							dxfUrl={item.file._blobUrl || item.file.filepath}
							className='w-full min-h-[400px] lg:min-h-[450px]'
							thickness={item.materialType?.height}
							maxPackageWidth={100}
							maxPackageHeight={200}
							parsedDxf={item.file._parsedDxf}
						/>
						{/* DXF Geometry Info */}
						{item.file._boundingBox && (
							<div className='mt-3 p-3 bg-muted/30 rounded-md space-y-1.5 text-xs text-muted-foreground'>
								<div className='flex items-center gap-1.5'>
									<Ruler className='h-3 w-3' />
									<span>
										Envolvente:{' '}
										{item.file._boundingBox.widthMm.toFixed(
											1,
										)}{' '}
										×{' '}
										{item.file._boundingBox.heightMm.toFixed(
											1,
										)}{' '}
										mm
									</span>
								</div>
								{item.file._cutLength && (
									<div className='flex items-center gap-1.5'>
										<Scissors className='h-3 w-3' />
										<span>
											Corte lineal:{' '}
											{(
												item.file._cutLength.totalMm /
												10
											).toFixed(1)}{' '}
											cm
										</span>
									</div>
								)}
								{item.file._piercings && (
									<div className='flex items-center gap-1.5'>
										<Target className='h-3 w-3' />
										<span>
											Perforaciones:{' '}
											{item.file._piercings.total}
										</span>
									</div>
								)}
								{item.file._pieceAreaMm2 != null && item.materialType && (
									<div className='flex items-center gap-1.5'>
										<Weight className='h-3 w-3' />
										<span>
											Peso estimado:{' '}
											{(
												(item.file._pieceAreaMm2 /
													(item.materialType.width * item.materialType.length)) *
												item.materialType.massPerUnit
											).toFixed(3)}{' '}
											kg
										</span>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Right: Material Selectors */}
					<div className='flex flex-col gap-4'>
						<h4 className='text-sm font-medium mb-1'>
							Configuración de material
						</h4>

						{/* Material Selector */}
						<div className='space-y-2'>
							<Label htmlFor={`material-${index}`}>
								Material
							</Label>
							<select
								id={`material-${index}`}
								className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
								value={item.material?.id || ''}
								onChange={(e) =>
									onMaterialChange(index, e.target.value)
								}
							>
								<option value=''>Seleccionar material</option>
								{materials.map((mat) => (
									<option key={mat.id} value={mat.id}>
										{mat.name}
										{mat.description &&
											` - ${mat.description}`}
									</option>
								))}
							</select>
						</div>

						{/* Material Type Selector */}
						<div className='space-y-2'>
							<Label htmlFor={`material-type-${index}`}>
								Espesor / Terminacion / Tipo
							</Label>
							<select
								id={`material-type-${index}`}
								className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed'
								value={item.materialType?.id || ''}
								onChange={(e) =>
									onMaterialTypeChange(
										index,
										item.material?.id || '',
										e.target.value,
									)
								}
								disabled={!item.material}
							>
								<option value=''>Seleccionar espesor</option>
								{selectedMaterial?.types.map((type) => (
									<option key={type.id} value={type.id}>
										{type.height}mm
										{type.finish && ` - ${type.finish}`}
										{' - '}
										{type.width}×{type.length}mm
										{type.stock > 0
											? ` (${type.stock} en stock)`
											: ' (Sin stock)'}
									</option>
								))}
							</select>
						</div>

						{/* Quantity Input */}
						<div className='space-y-2'>
							<Label htmlFor={`quantity-${index}`}>
								Cantidad
							</Label>
							<Input
								id={`quantity-${index}`}
								type='number'
								min={1}
								value={item.quantity}
								onChange={(e) =>
									onQuantityChange(
										index,
										Number(e.target.value) || 1,
									)
								}
								className='w-32'
							/>
						</div>

						{/* Size Warnings */}
						{sizeWarnings.length > 0 && (
							<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-1'>
								{sizeWarnings.map((warning, i) => (
									<p
										key={i}
										className='text-xs text-destructive flex items-center gap-1.5'
									>
										<AlertCircle className='h-3 w-3 shrink-0' />
										{warning}
									</p>
								))}
							</div>
						)}

						{/* Price Preview */}
						{item.materialType && (
							<div className='mt-4 p-4 bg-muted/30 rounded-md border'>
								{loadingPrice ? (
									<div className='flex items-center gap-2'>
										<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
										<span className='text-sm text-muted-foreground'>
											Calculando precio...
										</span>
									</div>
								) : breakdown ? (
									<>
										<div className='flex justify-between items-center'>
											<span className='text-sm text-muted-foreground'>
												Precio estimado:
											</span>
											<span className='text-lg font-semibold text-success'>
												{formatARS(
													breakdown.totalOrderPrice,
												)}
											</span>
										</div>
										<p className='text-xs text-muted-foreground mt-1'>
											{formatARS(breakdown.unitSalePrice)}{' '}
											× {item.quantity} pieza(s)
										</p>
										{breakdown.totalCuttingTimeMin > 0 && (
											<p className='text-xs text-muted-foreground mt-1'>
												Tiempo de corte:{' '}
												{Math.floor(breakdown.totalCuttingTimeMin)}m{' '}
												{Math.round((breakdown.totalCuttingTimeMin % 1) * 60)}s
											</p>
										)}
									</>
								) : (
									<>
										<div className='flex justify-between items-center'>
											<span className='text-sm text-muted-foreground'>
												Costo material (referencia):
											</span>
											<span className='text-lg font-semibold text-muted-foreground'>
												{formatARS(
													item.materialType
														.pricePerUnit *
														item.quantity,
												)}
											</span>
										</div>
										<p className='text-xs text-muted-foreground mt-1'>
											Precio de chapa completa ×{' '}
											{item.quantity}. El precio final
											será calculado en la revisión.
										</p>
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
