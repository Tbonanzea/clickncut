'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { PriceInput } from '@/components/ui/price-input';
import { formatPrice } from '@/lib/format';
import {
	createFixedCost,
	updateFixedCost,
	deleteFixedCost,
	toggleFixedCost,
} from './actions';

interface FixedCost {
	id: string;
	name: string;
	description: string | null;
	monthlyCost: number;
	isActive: boolean;
}

interface FixedCostsTabProps {
	fixedCosts: FixedCost[];
}

export function FixedCostsTab({ fixedCosts }: FixedCostsTabProps) {
	const [isPending, startTransition] = useTransition();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showNewForm, setShowNewForm] = useState(false);

	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editMonthlyCost, setEditMonthlyCost] = useState('');

	const [newName, setNewName] = useState('');
	const [newDescription, setNewDescription] = useState('');
	const [newMonthlyCost, setNewMonthlyCost] = useState('');
	const [error, setError] = useState('');

	const totalActive = fixedCosts
		.filter((fc) => fc.isActive)
		.reduce((sum, fc) => sum + fc.monthlyCost, 0);

	const startEditing = (fc: FixedCost) => {
		setEditingId(fc.id);
		setEditName(fc.name);
		setEditDescription(fc.description || '');
		setEditMonthlyCost(fc.monthlyCost.toString());
	};

	const cancelEditing = () => {
		setEditingId(null);
		setError('');
	};

	const handleUpdate = (id: string) => {
		startTransition(async () => {
			const result = await updateFixedCost(id, {
				name: editName,
				description: editDescription || undefined,
				monthlyCost: parseFloat(editMonthlyCost),
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setEditingId(null);
				setError('');
			}
		});
	};

	const handleCreate = () => {
		if (!newName || !newMonthlyCost) {
			setError('Nombre y costo mensual son requeridos');
			return;
		}
		startTransition(async () => {
			const result = await createFixedCost({
				name: newName,
				description: newDescription || undefined,
				monthlyCost: parseFloat(newMonthlyCost),
			});
			if (!result.success) {
				setError(result.error);
			} else {
				setShowNewForm(false);
				setNewName('');
				setNewDescription('');
				setNewMonthlyCost('');
				setError('');
			}
		});
	};

	const handleDelete = (id: string) => {
		startTransition(async () => {
			const result = await deleteFixedCost(id);
			if (!result.success) setError(result.error);
		});
	};

	const handleToggle = (id: string) => {
		startTransition(async () => {
			const result = await toggleFixedCost(id);
			if (!result.success) setError(result.error);
		});
	};

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='font-medium text-sm'>
						Costos Fijos Mensuales
					</h3>
					<p className='text-xs text-muted-foreground'>
						Gastos de overhead que se distribuyen por hora de
						producción
					</p>
				</div>
				<Button
					size='sm'
					onClick={() => setShowNewForm(true)}
					disabled={showNewForm}
				>
					<Plus className='mr-2 h-4 w-4' />
					Nuevo Costo
				</Button>
			</div>

			{error && (
				<div className='p-3 bg-destructive/10 text-destructive text-sm rounded-md'>
					{error}
				</div>
			)}

			<div className='border rounded-lg overflow-hidden'>
				<Table>
					<TableHeader>
						<TableRow className='bg-muted/50'>
							<TableHead className='text-xs'>Nombre</TableHead>
							<TableHead className='text-xs'>
								Descripción
							</TableHead>
							<TableHead className='text-right text-xs'>
								Costo Mensual
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
										value={newName}
										onChange={(e) =>
											setNewName(e.target.value)
										}
										placeholder='Nombre del costo'
										className='h-8 text-sm'
									/>
								</TableCell>
								<TableCell>
									<Input
										value={newDescription}
										onChange={(e) =>
											setNewDescription(e.target.value)
										}
										placeholder='Descripción (opcional)'
										className='h-8 text-sm'
									/>
								</TableCell>
								<TableCell>
									<PriceInput
										value={newMonthlyCost}
										onValueChange={setNewMonthlyCost}
										placeholder='0'
										className='text-right h-8 text-sm font-mono'
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
						{fixedCosts.map((fc) => (
							<TableRow
								key={fc.id}
								className={
									!fc.isActive ? 'opacity-40' : ''
								}
							>
								{editingId === fc.id ? (
									<>
										<TableCell>
											<Input
												value={editName}
												onChange={(e) =>
													setEditName(e.target.value)
												}
												className='h-8 text-sm'
											/>
										</TableCell>
										<TableCell>
											<Input
												value={editDescription}
												onChange={(e) =>
													setEditDescription(
														e.target.value
													)
												}
												className='h-8 text-sm'
											/>
										</TableCell>
										<TableCell>
											<PriceInput
												value={editMonthlyCost}
												onValueChange={setEditMonthlyCost}
												className='text-right h-8 text-sm font-mono'
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
														handleUpdate(fc.id)
													}
													disabled={isPending}
												>
													<Save className='h-3.5 w-3.5' />
												</Button>
												<Button
													size='icon'
													variant='ghost'
													className='h-7 w-7'
													onClick={cancelEditing}
												>
													<X className='h-3.5 w-3.5' />
												</Button>
											</div>
										</TableCell>
									</>
								) : (
									<>
										<TableCell className='font-medium text-sm'>
											{fc.name}
										</TableCell>
										<TableCell className='text-muted-foreground text-sm'>
											{fc.description || '—'}
										</TableCell>
										<TableCell className='text-right font-mono text-sm'>
											{formatPrice(fc.monthlyCost)}
										</TableCell>
										<TableCell className='text-center'>
											<Switch
												checked={fc.isActive}
												onCheckedChange={() =>
													handleToggle(fc.id)
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
														startEditing(fc)
													}
												>
													<Pencil className='h-3.5 w-3.5' />
												</Button>
												<Button
													size='icon'
													variant='ghost'
													className='h-7 w-7 text-destructive hover:text-destructive'
													onClick={() =>
														handleDelete(fc.id)
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
						{fixedCosts.length === 0 && !showNewForm && (
							<TableRow>
								<TableCell
									colSpan={5}
									className='text-center text-muted-foreground py-8 text-sm'
								>
									No hay costos fijos configurados.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className='flex justify-between items-center p-4 bg-primary/5 border border-primary/10 rounded-lg'>
				<span className='text-sm font-medium'>
					Total mensual (activos)
				</span>
				<span className='text-lg font-bold font-mono'>
					{formatPrice(totalActive)}
				</span>
			</div>
		</div>
	);
}
