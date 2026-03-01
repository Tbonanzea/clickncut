'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Save, X, TrendingUp, Percent } from 'lucide-react';
import {
	createVolumeDiscount,
	updateVolumeDiscount,
	deleteVolumeDiscount,
	toggleVolumeDiscount,
	upsertPricingConfig,
} from './actions';

interface VolumeDiscount {
	id: string;
	minQuantity: number;
	maxQuantity: number | null;
	discountPercentage: number;
	isActive: boolean;
}

interface DiscountsTabProps {
	config: {
		id: string;
		label: string;
		isActive: boolean;
		createdAt: Date;
		updatedAt: Date;
		profitMargin: number;
		urgencySurcharge: number;
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
		materialWasteFactor: number;
		nestingSafetyMargin: number;
	} | null;
	volumeDiscounts: VolumeDiscount[];
}

export function DiscountsTab({ config, volumeDiscounts }: DiscountsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(false);

	const [profitMargin, setProfitMargin] = useState(
		config ? (config.profitMargin * 100).toString() : '35'
	);
	const [urgencySurcharge, setUrgencySurcharge] = useState(
		config ? (config.urgencySurcharge * 100).toString() : '50'
	);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [showNewForm, setShowNewForm] = useState(false);
	const [editMin, setEditMin] = useState('');
	const [editMax, setEditMax] = useState('');
	const [editDiscount, setEditDiscount] = useState('');
	const [newMin, setNewMin] = useState('');
	const [newMax, setNewMax] = useState('');
	const [newDiscount, setNewDiscount] = useState('');

	const handleSaveMargins = () => {
		if (!config) return;
		startTransition(async () => {
			const {
				id: _id,
				label: _label,
				isActive: _isActive,
				createdAt: _createdAt,
				updatedAt: _updatedAt,
				...configFields
			} = config;
			const result = await upsertPricingConfig({
				...configFields,
				profitMargin: parseFloat(profitMargin) / 100,
				urgencySurcharge: parseFloat(urgencySurcharge) / 100,
			});
			if (!result.success) {
				setError(result.error);
				setSaved(false);
			} else {
				setError('');
				setSaved(true);
			}
		});
	};

	const startEditing = (vd: VolumeDiscount) => {
		setEditingId(vd.id);
		setEditMin(vd.minQuantity.toString());
		setEditMax(vd.maxQuantity?.toString() || '');
		setEditDiscount((vd.discountPercentage * 100).toString());
	};

	const handleCreateDiscount = () => {
		if (!newMin || !newDiscount) {
			setError('Cantidad mínima y porcentaje son requeridos');
			return;
		}
		startTransition(async () => {
			const result = await createVolumeDiscount({
				minQuantity: parseInt(newMin),
				maxQuantity: newMax ? parseInt(newMax) : null,
				discountPercentage: parseFloat(newDiscount) / 100,
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setShowNewForm(false);
				setNewMin('');
				setNewMax('');
				setNewDiscount('');
				setError('');
			}
		});
	};

	const handleUpdateDiscount = (id: string) => {
		startTransition(async () => {
			const result = await updateVolumeDiscount(id, {
				minQuantity: parseInt(editMin),
				maxQuantity: editMax ? parseInt(editMax) : null,
				discountPercentage: parseFloat(editDiscount) / 100,
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setEditingId(null);
				setError('');
			}
		});
	};

	const handleDeleteDiscount = (id: string) => {
		startTransition(async () => {
			const result = await deleteVolumeDiscount(id);
			if (!result.success) setError(result.error);
		});
	};

	const handleToggleDiscount = (id: string) => {
		startTransition(async () => {
			const result = await toggleVolumeDiscount(id);
			if (!result.success) setError(result.error);
		});
	};

	return (
		<div className='space-y-4'>
			{error && (
				<div className='p-3 bg-destructive/10 text-destructive text-sm rounded-md'>
					{error}
				</div>
			)}
			{saved && (
				<div className='p-3 bg-green-500/10 text-green-700 text-sm rounded-md'>
					Márgenes guardados correctamente
				</div>
			)}

			{/* Márgenes */}
			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-sm font-medium flex items-center gap-2'>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
						Márgenes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex items-end gap-4'>
						<div className='space-y-1.5 flex-1'>
							<Label className='text-xs font-medium text-muted-foreground'>
								Margen de ganancia
							</Label>
							<div className='flex items-center gap-1.5'>
								<Input
									type='number'
									value={profitMargin}
									onChange={(e) => {
										setProfitMargin(e.target.value);
										setSaved(false);
									}}
									step='1'
									className='font-mono h-9 text-sm'
								/>
								<span className='text-xs text-muted-foreground'>
									%
								</span>
							</div>
						</div>
						<div className='space-y-1.5 flex-1'>
							<Label className='text-xs font-medium text-muted-foreground'>
								Recargo urgencia (&lt;24h)
							</Label>
							<div className='flex items-center gap-1.5'>
								<Input
									type='number'
									value={urgencySurcharge}
									onChange={(e) => {
										setUrgencySurcharge(e.target.value);
										setSaved(false);
									}}
									step='1'
									className='font-mono h-9 text-sm'
								/>
								<span className='text-xs text-muted-foreground'>
									%
								</span>
							</div>
						</div>
						<Button
							onClick={handleSaveMargins}
							disabled={isPending || !config}
							size='sm'
							className='h-9'
						>
							<Save className='mr-2 h-3.5 w-3.5' />
							Guardar
						</Button>
					</div>
					{!config && (
						<p className='text-xs text-muted-foreground mt-3'>
							Guarda primero la configuración de Variables de
							Producción para habilitar los márgenes.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Descuentos por volumen */}
			<Card>
				<CardHeader className='pb-3'>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='text-sm font-medium flex items-center gap-2'>
								<Percent className='h-4 w-4 text-muted-foreground' />
								Descuentos por Volumen
							</CardTitle>
							<p className='text-xs text-muted-foreground mt-1'>
								Descuentos aplicados automáticamente según la
								cantidad de piezas
							</p>
						</div>
						<Button
							size='sm'
							onClick={() => setShowNewForm(true)}
							disabled={showNewForm}
						>
							<Plus className='mr-2 h-4 w-4' />
							Nuevo
						</Button>
					</div>
				</CardHeader>
				<CardContent className='pt-0'>
					<div className='border rounded-lg overflow-hidden'>
						<Table>
							<TableHeader>
								<TableRow className='bg-muted/50'>
									<TableHead className='text-xs'>
										Desde (piezas)
									</TableHead>
									<TableHead className='text-xs'>
										Hasta (piezas)
									</TableHead>
									<TableHead className='text-right text-xs'>
										Descuento
									</TableHead>
									<TableHead className='text-center text-xs w-20'>
										Activo
									</TableHead>
									<TableHead className='text-right text-xs w-24'>
										Acciones
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{showNewForm && (
									<TableRow className='bg-primary/5'>
										<TableCell>
											<Input
												type='number'
												value={newMin}
												onChange={(e) =>
													setNewMin(e.target.value)
												}
												placeholder='50'
												className='h-8 text-sm font-mono'
											/>
										</TableCell>
										<TableCell>
											<Input
												type='number'
												value={newMax}
												onChange={(e) =>
													setNewMax(e.target.value)
												}
												placeholder='Sin límite'
												className='h-8 text-sm font-mono'
											/>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Input
													type='number'
													value={newDiscount}
													onChange={(e) =>
														setNewDiscount(
															e.target.value
														)
													}
													placeholder='5'
													className='text-right h-8 text-sm font-mono'
													step='0.1'
												/>
												<span className='text-xs text-muted-foreground'>
													%
												</span>
											</div>
										</TableCell>
										<TableCell />
										<TableCell className='text-right'>
											<div className='flex justify-end gap-1'>
												<Button
													size='icon'
													variant='ghost'
													className='h-7 w-7'
													onClick={
														handleCreateDiscount
													}
													disabled={isPending}
												>
													<Save className='h-3.5 w-3.5' />
												</Button>
												<Button
													size='icon'
													variant='ghost'
													className='h-7 w-7'
													onClick={() => {
														setShowNewForm(false);
														setError('');
													}}
												>
													<X className='h-3.5 w-3.5' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								)}
								{volumeDiscounts.map((vd) => (
									<TableRow
										key={vd.id}
										className={
											!vd.isActive ? 'opacity-40' : ''
										}
									>
										{editingId === vd.id ? (
											<>
												<TableCell>
													<Input
														type='number'
														value={editMin}
														onChange={(e) =>
															setEditMin(
																e.target.value
															)
														}
														className='h-8 text-sm font-mono'
													/>
												</TableCell>
												<TableCell>
													<Input
														type='number'
														value={editMax}
														onChange={(e) =>
															setEditMax(
																e.target.value
															)
														}
														placeholder='Sin límite'
														className='h-8 text-sm font-mono'
													/>
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-1'>
														<Input
															type='number'
															value={editDiscount}
															onChange={(e) =>
																setEditDiscount(
																	e.target
																		.value
																)
															}
															className='text-right h-8 text-sm font-mono'
															step='0.1'
														/>
														<span className='text-xs text-muted-foreground'>
															%
														</span>
													</div>
												</TableCell>
												<TableCell />
												<TableCell className='text-right'>
													<div className='flex justify-end gap-1'>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7'
															onClick={() =>
																handleUpdateDiscount(
																	vd.id
																)
															}
															disabled={isPending}
														>
															<Save className='h-3.5 w-3.5' />
														</Button>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7'
															onClick={() =>
																setEditingId(
																	null
																)
															}
														>
															<X className='h-3.5 w-3.5' />
														</Button>
													</div>
												</TableCell>
											</>
										) : (
											<>
												<TableCell className='font-mono text-sm'>
													{vd.minQuantity.toLocaleString(
														'es-AR'
													)}
												</TableCell>
												<TableCell className='font-mono text-sm'>
													{vd.maxQuantity
														? vd.maxQuantity.toLocaleString(
																'es-AR'
															)
														: 'Sin límite'}
												</TableCell>
												<TableCell className='text-right font-mono text-sm font-medium'>
													{(
														vd.discountPercentage *
														100
													).toFixed(0)}
													%
												</TableCell>
												<TableCell className='text-center'>
													<Switch
														checked={vd.isActive}
														onCheckedChange={() =>
															handleToggleDiscount(
																vd.id
															)
														}
														disabled={isPending}
													/>
												</TableCell>
												<TableCell className='text-right'>
													<div className='flex justify-end gap-1'>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7'
															onClick={() =>
																startEditing(vd)
															}
														>
															<Pencil className='h-3.5 w-3.5' />
														</Button>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7 text-destructive hover:text-destructive'
															onClick={() =>
																handleDeleteDiscount(
																	vd.id
																)
															}
															disabled={isPending}
														>
															<Trash2 className='h-3.5 w-3.5' />
														</Button>
													</div>
												</TableCell>
											</>
										)}
									</TableRow>
								))}
								{volumeDiscounts.length === 0 &&
									!showNewForm && (
										<TableRow>
											<TableCell
												colSpan={5}
												className='text-center text-muted-foreground py-8 text-sm'
											>
												No hay descuentos por volumen
												configurados.
											</TableCell>
										</TableRow>
									)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
