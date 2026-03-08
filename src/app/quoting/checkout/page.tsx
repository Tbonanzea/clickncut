'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useQuoting } from '@/context/quotingContext';
import { useCalculatePrice } from '@/hooks/useCalculatePrice';
import {
	calculateExtrasTotal,
	useExtraServices,
} from '@/hooks/useExtraServices';
import { useSubmitOrder } from '@/hooks/useSubmitQuote';
import type { PricingBreakdown } from '@/lib/pricing-engine';
import {
	AlertCircle,
	Building2,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Copy,
	CreditCard,
	FileText,
	Loader2,
	MapPin,
	PackageCheck,
	Receipt,
	ShieldCheck,
	Truck,
} from 'lucide-react';
import { useState } from 'react';

function formatARS(value: number): string {
	return (
		'$' +
		value.toLocaleString('es-AR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	);
}

const AR_PROVINCES = [
	'Buenos Aires',
	'CABA',
	'Catamarca',
	'Chaco',
	'Chubut',
	'Córdoba',
	'Corrientes',
	'Entre Ríos',
	'Formosa',
	'Jujuy',
	'La Pampa',
	'La Rioja',
	'Mendoza',
	'Misiones',
	'Neuquén',
	'Río Negro',
	'Salta',
	'San Juan',
	'San Luis',
	'Santa Cruz',
	'Santa Fe',
	'Santiago del Estero',
	'Tierra del Fuego',
	'Tucumán',
];

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
						Tiempo de corte:{' '}
						{breakdown.totalCuttingTimeMin.toFixed(2)} min (corte:{' '}
						{breakdown.cuttingTimeMin.toFixed(2)} + piercing:{' '}
						{breakdown.piercingTimeMin.toFixed(2)})
					</p>
					<Separator className='my-2' />
					<BreakdownRow
						label='Material'
						value={breakdown.materialCost}
					/>
					<BreakdownRow label='Gas' value={breakdown.gasCost} />
					<BreakdownRow
						label='Energía'
						value={breakdown.energyCost}
					/>
					<BreakdownRow
						label='Consumibles'
						value={breakdown.consumablesCost}
					/>
					<BreakdownRow
						label='Costos fijos'
						value={breakdown.fixedCostAllocation}
					/>
					<BreakdownRow
						label='Amortización'
						value={breakdown.amortizationCost}
					/>
					<BreakdownRow
						label='Programación'
						value={breakdown.programmingCost}
					/>
					<BreakdownRow label='Setup' value={breakdown.setupCost} />
					<Separator className='my-2' />
					<BreakdownRow
						label='Costo total/pieza'
						value={breakdown.totalCostPerPiece}
					/>
					<BreakdownRow
						label='Ganancia'
						value={breakdown.profitPerPiece}
					/>
					{breakdown.volumeDiscount !== 0 && (
						<BreakdownRow
							label='Descuento volumen'
							value={breakdown.volumeDiscount}
						/>
					)}
					{breakdown.urgencySurchargeAmount > 0 && (
						<BreakdownRow
							label='Recargo urgencia'
							value={breakdown.urgencySurchargeAmount}
						/>
					)}
					{breakdown.logisticsCostPerPiece > 0 && (
						<BreakdownRow
							label='Logística (envío)'
							value={breakdown.logisticsCostPerPiece}
						/>
					)}
					{breakdown.paymentCommissionAmount > 0 && (
						<BreakdownRow
							label='Comisión MercadoPago'
							value={breakdown.paymentCommissionAmount}
						/>
					)}
					<Separator className='my-2' />
					<div className='flex justify-between font-medium text-sm'>
						<span>Precio unitario</span>
						<span className='font-mono'>
							{formatARS(breakdown.unitSalePrice)}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

export default function CheckoutPage() {
	const { cart, checkoutData, setCheckoutData, prevStep, goToStep } =
		useQuoting();
	const {
		mutate: submitOrder,
		isPending,
		error: submitError,
	} = useSubmitOrder();
	const { data: extraServices = [] } = useExtraServices();
	const {
		data: orderPricing,
		isLoading: loadingPrices,
		error: pricingError,
	} = useCalculatePrice(cart.items);

	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Pricing calculations
	const materialSubtotal = orderPricing
		? orderPricing.items.reduce(
				(sum, pr) => sum + pr.breakdown.totalOrderPrice,
				0,
			)
		: 0;
	const shippingCost = orderPricing?.shippingCost ?? 0;
	const isFreeShipping = orderPricing?.isFreeShipping ?? false;
	const freeShippingThreshold = orderPricing?.freeShippingThreshold ?? 0;
	const extrasTotal = calculateExtrasTotal(cart.extras || [], extraServices);
	const grandTotal = materialSubtotal + shippingCost + extrasTotal;

	// Bank info
	const bankInfo = {
		holder: process.env.NEXT_PUBLIC_BANK_HOLDER || 'Por configurar',
		cbu: process.env.NEXT_PUBLIC_BANK_CBU || 'Por configurar',
		alias: process.env.NEXT_PUBLIC_BANK_ALIAS || 'Por configurar',
		bank: process.env.NEXT_PUBLIC_BANK_NAME || 'Por configurar',
	};

	const copyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	// Helper to get breakdown for a specific cart item
	const getBreakdown = (idx: number): PricingBreakdown | undefined =>
		orderPricing?.items.find((pr) => pr.itemIndex === idx)?.breakdown;

	// Validation
	const hasBilling =
		checkoutData.invoiceType === 'CONSUMIDOR_FINAL'
			? !!checkoutData.customerName.trim() && !!checkoutData.dni.trim()
			: !!checkoutData.businessName.trim() && !!checkoutData.cuit.trim();

	const hasShipping =
		!!checkoutData.shippingAddress.trim() &&
		!!checkoutData.shippingCity.trim() &&
		!!checkoutData.shippingProvince &&
		!!checkoutData.shippingZipCode.trim();

	const hasPayment = !!checkoutData.paymentMethod;

	const canSubmit =
		hasBilling &&
		hasShipping &&
		hasPayment &&
		!isPending &&
		!loadingPrices &&
		!pricingError &&
		cart.items.length > 0;

	const handleSubmit = () => {
		if (canSubmit) {
			submitOrder();
		}
	};

	return (
		<div className='space-y-6'>
			{submitError && (
				<Alert variant='destructive'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>
						Error al procesar el pedido: {submitError.message}
					</AlertDescription>
				</Alert>
			)}

			{pricingError && (
				<Alert variant='destructive'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>
						Error al calcular precios: {pricingError.message}
					</AlertDescription>
				</Alert>
			)}

			<div className='grid lg:grid-cols-3 gap-6'>
				{/* Left column: Review + Forms */}
				<div className='lg:col-span-2 space-y-6'>
					{/* Order Items Review */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='flex items-center gap-2'>
									<FileText className='h-5 w-5' />
									Archivos y Materiales
								</CardTitle>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										goToStep('material-selection')
									}
								>
									Editar
								</Button>
							</div>
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
															<span className='font-medium'>
																Material:
															</span>{' '}
															{item.material
																?.name || 'N/A'}
														</div>
														<div>
															<span className='font-medium'>
																Espesor:
															</span>{' '}
															{item.materialType
																?.height || 0}
															mm
															{item.materialType
																?.finish && (
																<span className='ml-1'>
																	(
																	{
																		item
																			.materialType
																			.finish
																	}
																	)
																</span>
															)}
														</div>
														<div>
															<span className='font-medium'>
																Cantidad:
															</span>{' '}
															{item.quantity}{' '}
															{item.quantity === 1
																? 'pieza'
																: 'piezas'}
														</div>
													</div>
													{item.file._boundingBox && (
														<div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mt-1'>
															<div>
																Bounding box:{' '}
																{item.file._boundingBox.widthMm.toFixed(
																	1,
																)}{' '}
																x{' '}
																{item.file._boundingBox.heightMm.toFixed(
																	1,
																)}{' '}
																mm
															</div>
															{item.file
																._cutLength && (
																<div>
																	Corte
																	lineal:{' '}
																	{(
																		item
																			.file
																			._cutLength
																			.totalMm /
																		10
																	).toFixed(
																		1,
																	)}{' '}
																	cm
																</div>
															)}
															{item.file
																._piercings && (
																<div>
																	Perforaciones:{' '}
																	{
																		item
																			.file
																			._piercings
																			.total
																	}
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
																{formatARS(
																	breakdown.totalOrderPrice,
																)}
															</p>
															<p className='text-xs text-muted-foreground'>
																{formatARS(
																	breakdown.unitSalePrice,
																)}{' '}
																x{' '}
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
											{breakdown && (
												<PriceBreakdown
													breakdown={breakdown}
												/>
											)}
										</div>
									);
								})}
							</div>

							{/* Extras inline */}
							{cart.extras && cart.extras.length > 0 && (
								<>
									<Separator className='my-4' />
									<div className='space-y-2'>
										<p className='text-sm font-medium text-muted-foreground'>
											Servicios adicionales
										</p>
										{cart.extras.map((extraId) => {
											const service = extraServices.find(
												(s) => s.id === extraId,
											);
											if (!service) return null;
											return (
												<div
													key={extraId}
													className='flex justify-between text-sm'
												>
													<span>{service.name}</span>
													<span className='font-semibold'>
														{formatARS(
															service.price,
														)}
													</span>
												</div>
											);
										})}
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Billing */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Receipt className='h-5 w-5' />
								Datos de Facturación
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Invoice type selector */}
							<div className='grid grid-cols-2 gap-3'>
								<button
									type='button'
									onClick={() =>
										setCheckoutData({
											invoiceType: 'CONSUMIDOR_FINAL',
										})
									}
									className={`p-3 rounded-lg border-2 text-center transition-all ${
										checkoutData.invoiceType ===
										'CONSUMIDOR_FINAL'
											? 'border-primary bg-primary/5'
											: 'border-muted hover:border-muted-foreground/30'
									}`}
								>
									<p className='font-medium text-sm'>
										Consumidor Final
									</p>
								</button>
								<button
									type='button'
									onClick={() =>
										setCheckoutData({
											invoiceType: 'FACTURA_A',
										})
									}
									className={`p-3 rounded-lg border-2 text-center transition-all ${
										checkoutData.invoiceType === 'FACTURA_A'
											? 'border-primary bg-primary/5'
											: 'border-muted hover:border-muted-foreground/30'
									}`}
								>
									<p className='font-medium text-sm'>
										Factura A
									</p>
								</button>
							</div>

							{checkoutData.invoiceType === 'CONSUMIDOR_FINAL' ? (
								<div className='grid sm:grid-cols-3 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='customerName'>
											Nombre completo *
										</Label>
										<Input
											id='customerName'
											value={checkoutData.customerName}
											onChange={(e) =>
												setCheckoutData({
													customerName:
														e.target.value,
												})
											}
											placeholder='Juan Pérez'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='dni'>DNI *</Label>
										<Input
											id='dni'
											value={checkoutData.dni}
											onChange={(e) =>
												setCheckoutData({
													dni: e.target.value,
												})
											}
											placeholder='12345678'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='customerPhone'>
											Teléfono
										</Label>
										<Input
											id='customerPhone'
											type='tel'
											value={checkoutData.customerPhone}
											onChange={(e) =>
												setCheckoutData({
													customerPhone:
														e.target.value,
												})
											}
											placeholder='11 1234-5678'
										/>
									</div>
								</div>
							) : (
								<div className='space-y-4'>
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='businessName'>
												Razón Social *
											</Label>
											<Input
												id='businessName'
												value={
													checkoutData.businessName
												}
												onChange={(e) =>
													setCheckoutData({
														businessName:
															e.target.value,
													})
												}
												placeholder='Empresa S.A.'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='cuit'>
												CUIT/CUIL *
											</Label>
											<Input
												id='cuit'
												value={checkoutData.cuit}
												onChange={(e) =>
													setCheckoutData({
														cuit: e.target.value,
													})
												}
												placeholder='20-12345678-9'
											/>
										</div>
									</div>
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='taxCondition'>
												Condición frente al IVA
											</Label>
											<Select
												value={checkoutData.taxCondition}
												onValueChange={(value) =>
													setCheckoutData({
														taxCondition: value,
													})
												}
											>
												<SelectTrigger id='taxCondition'>
													<SelectValue placeholder='Seleccionar condición' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='Responsable Inscripto'>
														Responsable Inscripto
													</SelectItem>
													<SelectItem value='Monotributista'>
														Monotributista
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='customerPhone'>
												Teléfono
											</Label>
											<Input
												id='customerPhone'
												type='tel'
												value={checkoutData.customerPhone}
												onChange={(e) =>
													setCheckoutData({
														customerPhone:
															e.target.value,
													})
												}
												placeholder='11 1234-5678'
											/>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Shipping */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<MapPin className='h-5 w-5' />
								Dirección de Envío
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='shippingAddress'>
									Dirección *
								</Label>
								<Input
									id='shippingAddress'
									value={checkoutData.shippingAddress}
									onChange={(e) =>
										setCheckoutData({
											shippingAddress: e.target.value,
										})
									}
									placeholder='Av. Corrientes 1234, Piso 3'
								/>
							</div>
							<div className='grid sm:grid-cols-3 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='shippingCity'>
										Ciudad *
									</Label>
									<Input
										id='shippingCity'
										value={checkoutData.shippingCity}
										onChange={(e) =>
											setCheckoutData({
												shippingCity: e.target.value,
											})
										}
										placeholder='Buenos Aires'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='shippingProvince'>
										Provincia *
									</Label>
									<Select
										value={checkoutData.shippingProvince}
										onValueChange={(value) =>
											setCheckoutData({
												shippingProvince: value,
											})
										}
									>
										<SelectTrigger id='shippingProvince'>
											<SelectValue placeholder='Seleccionar' />
										</SelectTrigger>
										<SelectContent>
											{AR_PROVINCES.map((province) => (
												<SelectItem
													key={province}
													value={province}
												>
													{province}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='shippingZipCode'>
										Código Postal *
									</Label>
									<Input
										id='shippingZipCode'
										value={checkoutData.shippingZipCode}
										onChange={(e) =>
											setCheckoutData({
												shippingZipCode: e.target.value,
											})
										}
										placeholder='1000'
									/>
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='shippingNotes'>
									Notas de envío (opcional)
								</Label>
								<Input
									id='shippingNotes'
									value={checkoutData.shippingNotes}
									onChange={(e) =>
										setCheckoutData({
											shippingNotes: e.target.value,
										})
									}
									placeholder='Timbre 3B, dejar con el portero, etc.'
								/>
							</div>
						</CardContent>
					</Card>

					{/* Payment Method */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<CreditCard className='h-5 w-5' />
								Método de Pago
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* MercadoPago */}
							<button
								type='button'
								onClick={() =>
									setCheckoutData({
										paymentMethod: 'mercadopago',
									})
								}
								className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
									checkoutData.paymentMethod === 'mercadopago'
										? 'border-blue-500 bg-blue-50'
										: 'border-muted hover:border-muted-foreground/30'
								}`}
							>
								<div className='flex items-center gap-4'>
									<div className='flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
										<CreditCard className='h-6 w-6 text-blue-600' />
									</div>
									<div className='flex-1'>
										<h3 className='font-semibold'>
											MercadoPago
										</h3>
										<p className='text-sm text-muted-foreground'>
											Tarjetas de crédito, débito,
											efectivo y más
										</p>
									</div>
									<div className='flex items-center gap-1 text-xs text-success'>
										<ShieldCheck className='h-4 w-4' />
										Seguro
									</div>
								</div>
							</button>

							{checkoutData.paymentMethod === 'mercadopago' && (
								<div className='ml-16 p-3 bg-blue-50 border border-blue-200 rounded-md'>
									<p className='text-sm text-blue-800'>
										Serás redirigido a MercadoPago para
										completar tu pago de forma segura.
									</p>
								</div>
							)}

							{/* Bank Transfer */}
							<button
								type='button'
								onClick={() =>
									setCheckoutData({
										paymentMethod: 'transfer',
									})
								}
								className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
									checkoutData.paymentMethod === 'transfer'
										? 'border-emerald-500 bg-emerald-50'
										: 'border-muted hover:border-muted-foreground/30'
								}`}
							>
								<div className='flex items-center gap-4'>
									<div className='flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center'>
										<Building2 className='h-6 w-6 text-emerald-600' />
									</div>
									<div className='flex-1'>
										<h3 className='font-semibold'>
											Transferencia Bancaria
										</h3>
										<p className='text-sm text-muted-foreground'>
											Transferencia directa a nuestra
											cuenta
										</p>
									</div>
								</div>
							</button>

							{checkoutData.paymentMethod === 'transfer' && (
								<div className='ml-16 space-y-3'>
									<Alert>
										<AlertDescription>
											Tu pedido quedará pendiente hasta
											que confirmemos la recepción de la
											transferencia (24-48 hs hábiles).
										</AlertDescription>
									</Alert>
									<div className='bg-muted rounded-lg p-4 space-y-3'>
										<BankField
											label='Titular'
											value={bankInfo.holder}
											field='holder'
											copiedField={copiedField}
											onCopy={copyToClipboard}
										/>
										<BankField
											label='Banco'
											value={bankInfo.bank}
											field='bank'
											copiedField={copiedField}
											onCopy={copyToClipboard}
											showCopy={false}
										/>
										<BankField
											label='CBU'
											value={bankInfo.cbu}
											field='cbu'
											copiedField={copiedField}
											onCopy={copyToClipboard}
											mono
										/>
										<BankField
											label='Alias'
											value={bankInfo.alias}
											field='alias'
											copiedField={copiedField}
											onCopy={copyToClipboard}
										/>
										<Separator />
										<div className='flex justify-between items-center'>
											<span className='text-sm text-muted-foreground'>
												Monto
											</span>
											<div className='flex items-center gap-2'>
												<span className='font-bold text-lg text-success'>
													{formatARS(grandTotal)}
												</span>
												<Button
													variant='ghost'
													size='sm'
													onClick={() =>
														copyToClipboard(
															grandTotal.toFixed(
																2,
															),
															'amount',
														)
													}
												>
													{copiedField ===
													'amount' ? (
														<Check className='h-4 w-4 text-success' />
													) : (
														<Copy className='h-4 w-4' />
													)}
												</Button>
											</div>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right column: Order summary sidebar */}
				<div className='space-y-4'>
					<Card className='lg:sticky lg:top-[calc(4.5rem+1rem)]'>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<Truck className='h-5 w-5' />
								Resumen del Pedido
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Items */}
							<div className='space-y-2'>
								{cart.items.map((item, idx) => {
									const breakdown = getBreakdown(idx);
									return (
										<div
											key={`${item.file.id}-${idx}`}
											className='flex justify-between text-sm'
										>
											<div className='flex-1 min-w-0'>
												<p className='font-medium truncate'>
													{item.file.filename}
												</p>
												<p className='text-muted-foreground text-xs'>
													{item.material?.name} ·{' '}
													{item.materialType?.height}
													mm · x{item.quantity}
												</p>
											</div>
											<span className='ml-2 whitespace-nowrap'>
												{loadingPrices ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : breakdown ? (
													formatARS(
														breakdown.totalOrderPrice,
													)
												) : (
													'—'
												)}
											</span>
										</div>
									);
								})}
							</div>

							{/* Extras */}
							{cart.extras && cart.extras.length > 0 && (
								<>
									<Separator />
									<div className='space-y-2'>
										{cart.extras.map((extraId) => {
											const service = extraServices.find(
												(s) => s.id === extraId,
											);
											if (!service) return null;
											return (
												<div
													key={extraId}
													className='flex justify-between text-sm'
												>
													<span>{service.name}</span>
													<span>
														{formatARS(
															service.price,
														)}
													</span>
												</div>
											);
										})}
									</div>
								</>
							)}

							<Separator />

							{/* Totals */}
							<div className='space-y-2'>
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>
										Subtotal
									</span>
									{loadingPrices ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<span>
											{formatARS(materialSubtotal)}
										</span>
									)}
								</div>
								{extrasTotal > 0 && (
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>
											Extras
										</span>
										<span>{formatARS(extrasTotal)}</span>
									</div>
								)}
								<div className='flex justify-between text-sm'>
									<span className='text-muted-foreground'>
										Envío
									</span>
									{loadingPrices ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : isFreeShipping ? (
										<span className='text-green-600 font-medium'>
											Gratis
										</span>
									) : (
										<span>{formatARS(shippingCost)}</span>
									)}
								</div>
								{!loadingPrices && isFreeShipping && (
									<div className='flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md'>
										<PackageCheck className='h-4 w-4 text-green-600 flex-none' />
										<p className='text-xs text-green-700'>
											Envío gratis por superar{' '}
											{formatARS(freeShippingThreshold)}
										</p>
									</div>
								)}
								{!loadingPrices &&
									!isFreeShipping &&
									freeShippingThreshold > 0 && (
										<div className='p-2 bg-amber-500/10 border border-amber-500/20 rounded-md'>
											<p className='text-xs text-amber-700'>
												Envío gratis a partir de{' '}
												{formatARS(freeShippingThreshold)}.
												Te faltan{' '}
												{formatARS(
													freeShippingThreshold -
														materialSubtotal,
												)}{' '}
												para obtener envío gratis
											</p>
										</div>
									)}
								<Separator />
								<div className='flex justify-between font-bold text-lg'>
									<span>Total</span>
									{loadingPrices ? (
										<Loader2 className='h-5 w-5 animate-spin' />
									) : (
										<span className='text-success'>
											{formatARS(grandTotal)}
										</span>
									)}
								</div>
							</div>

							{/* Validation hints */}
							{!hasBilling && (
								<p className='text-xs text-amber-600'>
									Completá los datos de facturación
								</p>
							)}
							{!hasShipping && (
								<p className='text-xs text-amber-600'>
									Completá la dirección de envío
								</p>
							)}
							{!hasPayment && (
								<p className='text-xs text-amber-600'>
									Seleccioná un método de pago
								</p>
							)}

							{/* Submit */}
							<Button
								className='w-full min-h-[48px] text-base'
								size='lg'
								disabled={!canSubmit}
								onClick={handleSubmit}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Procesando...
									</>
								) : checkoutData.paymentMethod ===
								  'mercadopago' ? (
									'Pagar con MercadoPago'
								) : checkoutData.paymentMethod ===
								  'transfer' ? (
									'Confirmar Pedido'
								) : (
									'Confirmar y Pagar'
								)}
							</Button>

							<Button
								variant='outline'
								className='w-full'
								onClick={prevStep}
								disabled={isPending}
							>
								Volver
							</Button>

							{/* Security */}
							<div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
								<ShieldCheck className='h-3 w-3' />
								<span>Pago 100% seguro</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function BankField({
	label,
	value,
	field,
	copiedField,
	onCopy,
	mono = false,
	showCopy = true,
}: {
	label: string;
	value: string;
	field: string;
	copiedField: string | null;
	onCopy: (text: string, field: string) => void;
	mono?: boolean;
	showCopy?: boolean;
}) {
	return (
		<div className='flex justify-between items-center'>
			<span className='text-sm text-muted-foreground'>{label}</span>
			<div className='flex items-center gap-2'>
				<span className={`font-medium ${mono ? 'font-mono' : ''}`}>
					{value}
				</span>
				{showCopy && (
					<Button
						variant='ghost'
						size='sm'
						onClick={() => onCopy(value, field)}
					>
						{copiedField === field ? (
							<Check className='h-4 w-4 text-success' />
						) : (
							<Copy className='h-4 w-4' />
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
