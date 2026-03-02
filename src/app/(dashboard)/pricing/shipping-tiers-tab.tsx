'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Pencil, Trash2, Save, X, Package } from 'lucide-react';
import { PriceInput } from '@/components/ui/price-input';
import { formatPrice } from '@/lib/format';
import {
	createShippingTier,
	updateShippingTier,
	deleteShippingTier,
	toggleShippingTier,
} from './actions';

interface ShippingTier {
	id: string;
	label: string;
	maxShortCm: number;
	maxLongCm: number;
	shippingCost: number;
	isActive: boolean;
}

interface ShippingTiersTabProps {
	shippingTiers: ShippingTier[];
}

export function ShippingTiersTab({ shippingTiers }: ShippingTiersTabProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState('');

	const [editingId, setEditingId] = useState<string | null>(null);
	const [showNewForm, setShowNewForm] = useState(false);

	// Edit fields
	const [editLabel, setEditLabel] = useState('');
	const [editMaxShort, setEditMaxShort] = useState('');
	const [editMaxLong, setEditMaxLong] = useState('');
	const [editCost, setEditCost] = useState('');

	// New fields
	const [newLabel, setNewLabel] = useState('');
	const [newMaxShort, setNewMaxShort] = useState('');
	const [newMaxLong, setNewMaxLong] = useState('');
	const [newCost, setNewCost] = useState('');

	const startEditing = (tier: ShippingTier) => {
		setEditingId(tier.id);
		setEditLabel(tier.label);
		setEditMaxShort(tier.maxShortCm.toString());
		setEditMaxLong(tier.maxLongCm.toString());
		setEditCost(tier.shippingCost.toString());
	};

	const handleCreate = () => {
		if (!newLabel || !newMaxShort || !newMaxLong || !newCost) {
			setError('Todos los campos son requeridos');
			return;
		}
		startTransition(async () => {
			const result = await createShippingTier({
				label: newLabel,
				maxShortCm: parseFloat(newMaxShort),
				maxLongCm: parseFloat(newMaxLong),
				shippingCost: parseFloat(newCost),
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setShowNewForm(false);
				setNewLabel('');
				setNewMaxShort('');
				setNewMaxLong('');
				setNewCost('');
				setError('');
			}
		});
	};

	const handleUpdate = (id: string) => {
		startTransition(async () => {
			const result = await updateShippingTier(id, {
				label: editLabel,
				maxShortCm: parseFloat(editMaxShort),
				maxLongCm: parseFloat(editMaxLong),
				shippingCost: parseFloat(editCost),
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setEditingId(null);
				setError('');
			}
		});
	};

	const handleDelete = (id: string) => {
		startTransition(async () => {
			const result = await deleteShippingTier(id);
			if (!result.success) setError(result.error);
		});
	};

	const handleToggle = (id: string) => {
		startTransition(async () => {
			const result = await toggleShippingTier(id);
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

			<Card>
				<CardHeader className='pb-3'>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='text-sm font-medium flex items-center gap-2'>
								<Package className='h-4 w-4 text-muted-foreground' />
								Niveles de Envío por Tamaño
							</CardTitle>
							<p className='text-xs text-muted-foreground mt-1'>
								El costo de flete se asigna automáticamente según
								el bounding box de cada pieza. El primer nivel
								que contenga la pieza (lado corto y largo) se
								usa para calcular el flete.
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
										Nombre
									</TableHead>
									<TableHead className='text-right text-xs'>
										Max corto (cm)
									</TableHead>
									<TableHead className='text-right text-xs'>
										Max largo (cm)
									</TableHead>
									<TableHead className='text-right text-xs'>
										Costo flete ($)
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
												value={newLabel}
												onChange={(e) =>
													setNewLabel(e.target.value)
												}
												placeholder='Chico'
												className='h-8 text-sm'
											/>
										</TableCell>
										<TableCell>
											<Input
												type='number'
												value={newMaxShort}
												onChange={(e) =>
													setNewMaxShort(
														e.target.value
													)
												}
												placeholder='25'
												className='h-8 text-sm font-mono text-right'
											/>
										</TableCell>
										<TableCell>
											<Input
												type='number'
												value={newMaxLong}
												onChange={(e) =>
													setNewMaxLong(
														e.target.value
													)
												}
												placeholder='25'
												className='h-8 text-sm font-mono text-right'
											/>
										</TableCell>
										<TableCell>
											<PriceInput
												value={newCost}
												onValueChange={setNewCost}
												className='h-8 text-sm font-mono'
											/>
										</TableCell>
										<TableCell />
										<TableCell className='text-right'>
											<div className='flex justify-end gap-1'>
												<Button
													size='icon'
													variant='ghost'
													className='h-7 w-7'
													onClick={handleCreate}
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
								{shippingTiers.map((tier) => (
									<TableRow
										key={tier.id}
										className={
											!tier.isActive ? 'opacity-40' : ''
										}
									>
										{editingId === tier.id ? (
											<>
												<TableCell>
													<Input
														value={editLabel}
														onChange={(e) =>
															setEditLabel(
																e.target.value
															)
														}
														className='h-8 text-sm'
													/>
												</TableCell>
												<TableCell>
													<Input
														type='number'
														value={editMaxShort}
														onChange={(e) =>
															setEditMaxShort(
																e.target.value
															)
														}
														className='h-8 text-sm font-mono text-right'
													/>
												</TableCell>
												<TableCell>
													<Input
														type='number'
														value={editMaxLong}
														onChange={(e) =>
															setEditMaxLong(
																e.target.value
															)
														}
														className='h-8 text-sm font-mono text-right'
													/>
												</TableCell>
												<TableCell>
													<PriceInput
														value={editCost}
														onValueChange={
															setEditCost
														}
														className='h-8 text-sm font-mono'
													/>
												</TableCell>
												<TableCell />
												<TableCell className='text-right'>
													<div className='flex justify-end gap-1'>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7'
															onClick={() =>
																handleUpdate(
																	tier.id
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
												<TableCell className='text-sm font-medium'>
													{tier.label}
												</TableCell>
												<TableCell className='text-right font-mono text-sm'>
													{tier.maxShortCm}
												</TableCell>
												<TableCell className='text-right font-mono text-sm'>
													{tier.maxLongCm}
												</TableCell>
												<TableCell className='text-right font-mono text-sm font-medium'>
													{formatPrice(
														tier.shippingCost
													)}
												</TableCell>
												<TableCell className='text-center'>
													<Switch
														checked={tier.isActive}
														onCheckedChange={() =>
															handleToggle(
																tier.id
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
																startEditing(
																	tier
																)
															}
														>
															<Pencil className='h-3.5 w-3.5' />
														</Button>
														<Button
															size='icon'
															variant='ghost'
															className='h-7 w-7 text-destructive hover:text-destructive'
															onClick={() =>
																handleDelete(
																	tier.id
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
								{shippingTiers.length === 0 &&
									!showNewForm && (
										<TableRow>
											<TableCell
												colSpan={6}
												className='text-center text-muted-foreground py-8 text-sm'
											>
												No hay niveles de envío
												configurados. El flete se
												calculará con el valor fijo de
												Variables.
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
