'use client';

import { useState } from 'react';
import { useQuoting } from '@/context/quotingContext';
import { useSubmitQuote } from '@/hooks/useSubmitQuote';
import { useExtraServices, calculateExtrasTotal } from '@/hooks/useExtraServices';
import { useCalculatePrice } from '@/hooks/useCalculatePrice';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
	CheckCircle2,
	FileText,
	Plus,
	Loader2,
	ChevronDown,
	ChevronUp,
	AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PricingBreakdown } from '@/lib/pricing-engine';

function formatARS(value: number): string {
	return '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
	return (
		<div className='flex justify-between text-sm'>
			<span className='text-muted-foreground'>{label}</span>
			<span className='font-mono'>{formatARS(value)}</span>
		</div>
	);
}

function PriceBreakdown({ breakdown }: { breakdown: PricingBreakdown }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className='mt-3'>
			<button
				onClick={() => setExpanded(!expanded)}
				className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
			>
				{expanded ? (
					<ChevronUp className='h-3 w-3' />
				) : (
					<ChevronDown className='h-3 w-3' />
				)}
				Ver desglose
			</button>
			{expanded && (
				<div className='mt-2 p-3 bg-muted/50 rounded-md space-y-1.5 text-xs'>
					<p className='font-medium text-xs mb-2'>
						Tiempo de corte: {breakdown.totalCuttingTimeMin.toFixed(2)} min
						(corte: {breakdown.cuttingTimeMin.toFixed(2)} + piercing: {breakdown.piercingTimeMin.toFixed(2)})
					</p>
					<Separator className='my-2' />
					<BreakdownRow label='Material' value={breakdown.materialCost} />
					<BreakdownRow label='Gas' value={breakdown.gasCost} />
					<BreakdownRow label='Energía' value={breakdown.energyCost} />
					<BreakdownRow label='Consumibles' value={breakdown.consumablesCost} />
					<BreakdownRow label='Costos fijos' value={breakdown.fixedCostAllocation} />
					<BreakdownRow label='Amortización' value={breakdown.amortizationCost} />
					<BreakdownRow label='Programación' value={breakdown.programmingCost} />
					<BreakdownRow label='Setup' value={breakdown.setupCost} />
					<BreakdownRow label='Embalaje' value={breakdown.packagingCost} />
					<BreakdownRow label='Despacho' value={breakdown.dispatchCost} />
					<BreakdownRow label='Flete' value={breakdown.shippingCost} />
					<Separator className='my-2' />
					<BreakdownRow label='Costo total/pieza' value={breakdown.totalCostPerPiece} />
					<BreakdownRow label='Ganancia' value={breakdown.profitPerPiece} />
					{breakdown.volumeDiscount !== 0 && (
						<BreakdownRow label='Descuento volumen' value={breakdown.volumeDiscount} />
					)}
					{breakdown.urgencySurchargeAmount > 0 && (
						<BreakdownRow label='Recargo urgencia' value={breakdown.urgencySurchargeAmount} />
					)}
					{breakdown.paymentCommissionAmount > 0 && (
						<BreakdownRow label='Comisión MercadoPago' value={breakdown.paymentCommissionAmount} />
					)}
					<Separator className='my-2' />
					<div className='flex justify-between font-medium text-sm'>
						<span>Precio unitario</span>
						<span className='font-mono'>{formatARS(breakdown.unitSalePrice)}</span>
					</div>
				</div>
			)}
		</div>
	);
}

export default function ReviewPage() {
	const { cart, prevStep, goToStep } = useQuoting();
	const { mutate: submitQuote, isPending, error } = useSubmitQuote();
	const { data: extraServices = [], isLoading: loadingExtras } = useExtraServices();
	const {
		data: priceResults,
		isLoading: loadingPrices,
		error: pricingError,
	} = useCalculatePrice(cart.items);

	// Calculate extras total
	const extrasTotal = calculateExtrasTotal(cart.extras || [], extraServices);

	// Calculate material subtotal from pricing engine results
	const materialSubtotal = priceResults
		? priceResults.reduce((sum, pr) => sum + pr.breakdown.totalOrderPrice, 0)
		: 0;

	// Grand total
	const grandTotal = materialSubtotal + extrasTotal;

	// Total items count
	const totalItemsCount = cart.items.reduce(
		(sum, item) => sum + item.quantity,
		0
	);

	// Helper to get breakdown for a specific cart item
	const getBreakdown = (idx: number): PricingBreakdown | undefined =>
		priceResults?.find((pr) => pr.itemIndex === idx)?.breakdown;

	const canSubmit =
		cart.items.length > 0 &&
		!loadingPrices &&
		!pricingError &&
		priceResults &&
		priceResults.length > 0 &&
		cart.items.every(
			(item) =>
				item.file &&
				item.material &&
				item.materialType &&
				item.quantity > 0
		);

	const handleSubmit = () => {
		if (canSubmit && !isPending) {
			submitQuote();
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<Card>
				<CardHeader>
					<CardTitle>Revisión de Cotización</CardTitle>
					<CardDescription>
						Revisa todos los detalles antes de enviar tu cotización.
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Pricing error */}
			{pricingError && (
				<Alert variant='destructive'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>
						Error al calcular precios: {pricingError.message}
					</AlertDescription>
				</Alert>
			)}

			{/* Files & Materials Summary */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<FileText className='h-5 w-5' />
						Archivos y Materiales
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{cart.items.map((item, idx) => {
							const breakdown = getBreakdown(idx);

							return (
								<div
									key={`${item.file.id}-${idx}`}
									className='p-4 border rounded-lg bg-muted/30'
								>
									<div className='flex items-start justify-between'>
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-2'>
												<CheckCircle2 className='h-4 w-4 text-success' />
												<h4 className='font-semibold'>
													{item.file.filename}
												</h4>
											</div>
											<div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
												<div>
													<span className='font-medium'>Material:</span>{' '}
													{item.material?.name || 'N/A'}
												</div>
												<div>
													<span className='font-medium'>Espesor:</span>{' '}
													{item.materialType?.height || 0}mm
													{item.materialType?.finish && (
														<span className='ml-1'>({item.materialType.finish})</span>
													)}
												</div>
												<div>
													<span className='font-medium'>Cantidad:</span>{' '}
													{item.quantity}{' '}
													{item.quantity === 1 ? 'pieza' : 'piezas'}
												</div>
											</div>
											{/* DXF geometry info */}
											{item.file._boundingBox && (
												<div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mt-1'>
													<div>
														Bounding box:{' '}
														{item.file._boundingBox.widthMm.toFixed(1)} x{' '}
														{item.file._boundingBox.heightMm.toFixed(1)} mm
													</div>
													{item.file._cutLength && (
														<div>
															Corte lineal:{' '}
															{(item.file._cutLength.totalMm / 10).toFixed(1)} cm
														</div>
													)}
													{item.file._piercings && (
														<div>
															Perforaciones: {item.file._piercings.total}
														</div>
													)}
												</div>
											)}
										</div>
										<div className='text-right ml-4'>
											{loadingPrices ? (
												<Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
											) : breakdown ? (
												<>
													<p className='text-lg font-semibold text-success'>
														{formatARS(breakdown.totalOrderPrice)}
													</p>
													<p className='text-xs text-muted-foreground'>
														{formatARS(breakdown.unitSalePrice)} x{' '}
														{item.quantity}
													</p>
												</>
											) : (
												<p className='text-sm text-muted-foreground'>
													—
												</p>
											)}
										</div>
									</div>
									{breakdown && <PriceBreakdown breakdown={breakdown} />}
								</div>
							);
						})}
					</div>

					<Separator className='my-4' />

					<div className='flex justify-between items-center'>
						<div>
							<p className='text-sm text-muted-foreground'>Total de archivos</p>
							<p className='text-lg font-semibold'>
								{cart.items.length} archivo{cart.items.length !== 1 && 's'}
							</p>
						</div>
						<div className='text-right'>
							<p className='text-sm text-muted-foreground'>Subtotal corte</p>
							{loadingPrices ? (
								<Loader2 className='h-5 w-5 animate-spin text-muted-foreground ml-auto' />
							) : (
								<p className='text-xl font-semibold text-success'>
									{formatARS(materialSubtotal)}
								</p>
							)}
						</div>
					</div>

					<div className='mt-4 flex justify-end'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => goToStep('material-selection')}
						>
							Editar materiales
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Extras Summary */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Plus className='h-5 w-5' />
						Servicios Adicionales
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingExtras ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
						</div>
					) : cart.extras && cart.extras.length > 0 ? (
						<>
							<div className='space-y-3'>
								{cart.extras.map((extraId) => {
									const service = extraServices.find(
										(s) => s.id === extraId
									);
									if (!service) return null;

									return (
										<div
											key={extraId}
											className='flex justify-between items-center p-3 border rounded-md bg-info/10'
										>
											<div>
												<p className='font-medium'>
													{service.name}
												</p>
												<p className='text-xs text-muted-foreground'>
													{service.description}
												</p>
											</div>
											<div className='text-right'>
												<p className='font-semibold text-success'>
													{formatARS(service.price)}
												</p>
												<p className='text-xs text-muted-foreground'>
													{service.unit}
												</p>
											</div>
										</div>
									);
								})}
							</div>

							<Separator className='my-4' />

							<div className='flex justify-between items-center'>
								<p className='text-sm text-muted-foreground'>
									Total extras
								</p>
								<p className='text-xl font-semibold text-success'>
									{formatARS(extrasTotal)}
								</p>
							</div>
						</>
					) : (
						<div className='text-center py-8 text-muted-foreground'>
							<p>No se seleccionaron servicios adicionales</p>
						</div>
					)}

					<div className='mt-4 flex justify-end'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => goToStep('extras')}
						>
							{cart.extras && cart.extras.length > 0
								? 'Editar extras'
								: 'Agregar extras'}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Grand Total */}
			<Card className='border-2 border-primary'>
				<CardContent className='pt-6'>
					<div className='space-y-4'>
						<div className='flex justify-between items-center text-lg'>
							<span className='text-muted-foreground'>
								Subtotal corte
							</span>
							{loadingPrices ? (
								<Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
							) : (
								<span className='font-semibold'>
									{formatARS(materialSubtotal)}
								</span>
							)}
						</div>

						{extrasTotal > 0 && (
							<div className='flex justify-between items-center text-lg'>
								<span className='text-muted-foreground'>
									Servicios adicionales
								</span>
								<span className='font-semibold'>
									{formatARS(extrasTotal)}
								</span>
							</div>
						)}

						<Separator />

						<div className='flex justify-between items-center'>
							<div>
								<p className='text-2xl font-bold'>Total</p>
								<p className='text-sm text-muted-foreground'>
									{totalItemsCount} pieza
									{totalItemsCount !== 1 && 's'} ·{' '}
									{cart.items.length} archivo
									{cart.items.length !== 1 && 's'}
								</p>
							</div>
							{loadingPrices ? (
								<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
							) : (
								<p className='text-3xl font-bold text-success'>
									{formatARS(grandTotal)}
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<Card className='bg-muted/30'>
				<CardContent className='pt-6'>
					<div className='space-y-4'>
						{error && (
							<Alert variant='destructive'>
								<AlertDescription>
									Error al enviar cotización: {error.message}
								</AlertDescription>
							</Alert>
						)}

						<div className='flex items-start gap-3'>
							<Badge variant='outline' className='mt-1'>
								Nota
							</Badge>
							<p className='text-sm text-muted-foreground'>
								Esta es una cotización preliminar. El precio
								final puede variar según la complejidad del
								diseño y la disponibilidad de materiales. Nos
								pondremos en contacto contigo para confirmar los
								detalles.
							</p>
						</div>

						<Separator />

						<div className='flex flex-col md:flex-row gap-3 md:justify-between'>
							<Button
								variant='outline'
								onClick={prevStep}
								disabled={isPending}
								className='w-full md:w-auto min-h-[44px]'
							>
								Volver
							</Button>
							<Button
								disabled={!canSubmit || isPending}
								onClick={handleSubmit}
								className='w-full md:w-auto min-h-[48px] text-base'
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Enviando...
									</>
								) : (
									'Enviar Cotización'
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
