'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, Trash2, Pencil, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
	getMaterialById,
	updateMaterial,
	createMaterialType,
	updateMaterialType,
	deleteMaterialType,
} from '../actions';
import { MaterialType } from '@/generated/prisma/browser';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { PriceInput } from '@/components/ui/price-input';
import { formatPrice, parseFormattedNumber } from '@/lib/format';

type MaterialWithTypes = Awaited<ReturnType<typeof getMaterialById>>;

export default function EditMaterialPage() {
	const params = useParams();
	const materialId = params.id as string;

	const [material, setMaterial] = useState<MaterialWithTypes | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showNewTypeForm, setShowNewTypeForm] = useState(false);
	const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

	useEffect(() => {
		async function fetchMaterial() {
			const result = await getMaterialById(materialId);
			setMaterial(result);
			setLoading(false);
		}
		fetchMaterial();
	}, [materialId]);

	const handleUpdateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		const result = await updateMaterial(materialId, { name, description });

		if (result.success) {
			setMaterial((prev) =>
				prev ? { ...prev, name, description: description || null } : null
			);
		} else {
			setError(result.error || 'Error al actualizar');
		}
		setSaving(false);
	};

	const parseMaterialTypeForm = (formData: FormData) => {
		const assistGasVal = formData.get('assistGas') as string;
		return {
			width: parseFloat(formData.get('width') as string),
			length: parseFloat(formData.get('length') as string),
			height: parseFloat(formData.get('height') as string),
			pricePerUnit: parseFormattedNumber(formData.get('pricePerUnit') as string),
			massPerUnit: parseFloat(formData.get('massPerUnit') as string),
			stock: parseInt(formData.get('stock') as string),
			errorMargin: parseFloat(formData.get('errorMargin') as string),
			maxCutLength: parseFloat(formData.get('maxCutLength') as string),
			minCutLength: parseFloat(formData.get('minCutLength') as string),
			maxCutWidth: parseFloat(formData.get('maxCutWidth') as string),
			minCutWidth: parseFloat(formData.get('minCutWidth') as string),
			// Cutting parameters
			cuttingSpeed: formData.get('cuttingSpeed') ? parseFloat(formData.get('cuttingSpeed') as string) : null,
			assistGas: assistGasVal && assistGasVal !== '_none' ? assistGasVal : null,
			gasConsumption: formData.get('gasConsumption') ? parseFloat(formData.get('gasConsumption') as string) : null,
			gasPressure: formData.get('gasPressure') ? parseFloat(formData.get('gasPressure') as string) : null,
			piercingTime: formData.get('piercingTime') ? parseFloat(formData.get('piercingTime') as string) : null,
			piercingDistance: formData.get('piercingDistance') ? parseFloat(formData.get('piercingDistance') as string) : null,
			sheetWeight: formData.get('sheetWeight') ? parseFloat(formData.get('sheetWeight') as string) : null,
			finish: (formData.get('finish') as string) || null,
		};
	};

	const handleCreateType = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		const data = parseMaterialTypeForm(new FormData(e.currentTarget));
		const result = await createMaterialType(materialId, data);

		if (result.success && result.materialType) {
			setMaterial((prev) =>
				prev
					? {
							...prev,
							types: [...prev.types, result.materialType as MaterialType],
					  }
					: null
			);
			setShowNewTypeForm(false);
			(e.target as HTMLFormElement).reset();
		} else {
			setError(result.error || 'Error al crear tipo');
		}
		setSaving(false);
	};

	const handleUpdateType = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!editingTypeId) return;
		setSaving(true);
		setError(null);

		const data = parseMaterialTypeForm(new FormData(e.currentTarget));
		const result = await updateMaterialType(editingTypeId, data);

		if (result.success && result.materialType) {
			setMaterial((prev) =>
				prev
					? {
							...prev,
							types: prev.types.map((t) =>
								t.id === editingTypeId ? (result.materialType as MaterialType) : t
							),
					  }
					: null
			);
			setEditingTypeId(null);
		} else {
			setError(result.error || 'Error al actualizar tipo');
		}
		setSaving(false);
	};

	const handleDeleteType = async (typeId: string) => {
		if (!confirm('¿Eliminar este tipo de material?')) return;

		const result = await deleteMaterialType(typeId);
		if (result.success) {
			setMaterial((prev) =>
				prev
					? { ...prev, types: prev.types.filter((t) => t.id !== typeId) }
					: null
			);
		} else {
			toast.error(result.error);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!material) {
		return (
			<div className="container mx-auto py-10">
				<Card>
					<CardContent className="py-10 text-center">
						<p className="text-destructive">Material no encontrado</p>
						<Button asChild variant="outline" className="mt-4">
							<Link href="/materials">Volver a materiales</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10 space-y-6">
			<div className="flex items-center gap-4">
				<Button asChild variant="ghost" size="sm">
					<Link href="/materials">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Volver
					</Link>
				</Button>
				<h1 className="text-2xl font-bold">Editar Material</h1>
			</div>

			{error && (
				<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
					{error}
				</div>
			)}

			{/* Material Info */}
			<Card>
				<CardHeader>
					<CardTitle>Información del Material</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleUpdateMaterial} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nombre *</Label>
								<Input
									id="name"
									name="name"
									defaultValue={material.name}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Descripción</Label>
								<Input
									id="description"
									name="description"
									defaultValue={material.description || ''}
								/>
							</div>
						</div>
						<div className="flex justify-end">
							<Button type="submit" disabled={saving}>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								<Save className="mr-2 h-4 w-4" />
								Guardar Cambios
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Material Types */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Tipos de Material (Espesores)</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Configura dimensiones, precios y parámetros de corte
						</p>
					</div>
					<Button onClick={() => { setShowNewTypeForm(!showNewTypeForm); setEditingTypeId(null); }}>
						<Plus className="mr-2 h-4 w-4" />
						Nuevo Tipo
					</Button>
				</CardHeader>
				<CardContent>
					{showNewTypeForm && (
						<MaterialTypeForm
							onSubmit={handleCreateType}
							onCancel={() => setShowNewTypeForm(false)}
							saving={saving}
							submitLabel="Crear Tipo"
						/>
					)}

					{material.types.length === 0 && !showNewTypeForm ? (
						<p className="text-center text-muted-foreground py-8 text-sm">
							No hay tipos de material configurados
						</p>
					) : (
						material.types.map((type) => (
							<div key={type.id} className="border rounded-lg mb-4 last:mb-0">
								{editingTypeId === type.id ? (
									<MaterialTypeForm
										defaultValues={type}
										onSubmit={handleUpdateType}
										onCancel={() => setEditingTypeId(null)}
										saving={saving}
										submitLabel="Guardar Cambios"
									/>
								) : (
									<div className="p-4">
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-medium text-sm">
												Espesor {type.height} mm — {type.width} x {type.length} mm
											</h4>
											<div className="flex gap-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => { setEditingTypeId(type.id); setShowNewTypeForm(false); }}
												>
													<Pencil className="mr-1 h-3 w-3" />
													Editar
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteType(type.id)}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>

										{/* Comercial */}
										<div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
											<TypeField label="Precio" value={formatPrice(type.pricePerUnit)} />
											<TypeField label="Masa" value={`${Number(type.massPerUnit.toFixed(2))} kg`} />
											<TypeField label="Stock" value={`${type.stock} uds`} />
											<TypeField label="Corte ancho" value={`${type.minCutWidth}–${type.maxCutWidth} mm`} />
											<TypeField label="Corte largo" value={`${type.minCutLength}–${type.maxCutLength} mm`} />
										</div>

										{/* Parámetros de corte */}
										{type.cuttingSpeed != null && (
											<>
												<div className="border-t mt-3 pt-3">
													<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Parámetros de corte</p>
													<div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
														<TypeField label="Vel. corte" value={`${type.cuttingSpeed} mm/min`} />
														{type.assistGas && <TypeField label="Gas" value={type.assistGas} />}
														{type.gasConsumption != null && <TypeField label="Consumo" value={`${type.gasConsumption} L/min`} />}
														{type.gasPressure != null && <TypeField label="Presión" value={`${type.gasPressure} bar`} />}
														{type.piercingTime != null && <TypeField label="Perforación" value={`${type.piercingTime} s`} />}
														{type.piercingDistance != null && <TypeField label="Dist. perf." value={`${type.piercingDistance} mm`} />}
														{type.sheetWeight != null && <TypeField label="Peso chapa" value={`${Number(type.sheetWeight.toFixed(2))} kg`} />}
														{type.finish && <TypeField label="Terminación" value={type.finish} />}
													</div>
												</div>
											</>
										)}
									</div>
								)}
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ---------------------------------------------------------------------------
// MaterialTypeForm — shared between create and edit
// ---------------------------------------------------------------------------

function MaterialTypeForm({
	defaultValues,
	onSubmit,
	onCancel,
	saving,
	submitLabel,
}: {
	defaultValues?: MaterialType;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;
	saving: boolean;
	submitLabel: string;
}) {
	const [assistGas, setAssistGas] = useState(defaultValues?.assistGas || '');

	return (
		<form onSubmit={onSubmit} className="p-4 bg-muted rounded-lg mb-4">
			<h4 className="font-medium mb-4">{defaultValues ? `Editar Espesor ${defaultValues.height} mm` : 'Nuevo Tipo de Material'}</h4>

			{/* Dimensiones y comerciales */}
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dimensiones y Comercial</p>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				<div>
					<Label htmlFor="height">Espesor (mm) *</Label>
					<Input id="height" name="height" type="number" step="0.1" defaultValue={defaultValues?.height ?? ''} required />
				</div>
				<div>
					<Label htmlFor="width">Ancho (mm) *</Label>
					<Input id="width" name="width" type="number" step="0.1" defaultValue={defaultValues?.width ?? ''} required />
				</div>
				<div>
					<Label htmlFor="length">Largo (mm) *</Label>
					<Input id="length" name="length" type="number" step="0.1" defaultValue={defaultValues?.length ?? ''} required />
				</div>
				<div>
					<Label htmlFor="pricePerUnit">Precio/Unidad ($) *</Label>
					<PriceInput id="pricePerUnit" name="pricePerUnit" defaultValue={defaultValues?.pricePerUnit ?? ''} required />
				</div>
				<div>
					<Label htmlFor="massPerUnit">Masa/Unidad (kg) *</Label>
					<Input id="massPerUnit" name="massPerUnit" type="number" step="0.01" defaultValue={defaultValues?.massPerUnit ?? ''} required />
				</div>
				<div>
					<Label htmlFor="stock">Stock *</Label>
					<Input id="stock" name="stock" type="number" defaultValue={defaultValues?.stock ?? ''} required />
				</div>
				<div>
					<Label htmlFor="errorMargin">Margen Error (mm) *</Label>
					<Input id="errorMargin" name="errorMargin" type="number" step="0.1" defaultValue={defaultValues?.errorMargin ?? ''} required />
				</div>
			</div>

			{/* Límites de corte */}
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Límites de Corte</p>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				<div>
					<Label htmlFor="minCutWidth">Mín Ancho (mm) *</Label>
					<Input id="minCutWidth" name="minCutWidth" type="number" step="0.1" defaultValue={defaultValues?.minCutWidth ?? ''} required />
				</div>
				<div>
					<Label htmlFor="maxCutWidth">Máx Ancho (mm) *</Label>
					<Input id="maxCutWidth" name="maxCutWidth" type="number" step="0.1" defaultValue={defaultValues?.maxCutWidth ?? ''} required />
				</div>
				<div>
					<Label htmlFor="minCutLength">Mín Largo (mm) *</Label>
					<Input id="minCutLength" name="minCutLength" type="number" step="0.1" defaultValue={defaultValues?.minCutLength ?? ''} required />
				</div>
				<div>
					<Label htmlFor="maxCutLength">Máx Largo (mm) *</Label>
					<Input id="maxCutLength" name="maxCutLength" type="number" step="0.1" defaultValue={defaultValues?.maxCutLength ?? ''} required />
				</div>
			</div>

			{/* Parámetros de corte */}
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Parámetros de Corte</p>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
				<div>
					<Label htmlFor="cuttingSpeed">Vel. corte (mm/min)</Label>
					<Input id="cuttingSpeed" name="cuttingSpeed" type="number" step="0.1" defaultValue={defaultValues?.cuttingSpeed ?? ''} />
				</div>
				<div>
					<Label htmlFor="assistGas">Gas asistente</Label>
					<input type="hidden" name="assistGas" value={assistGas} />
					<Select value={assistGas || '_none'} onValueChange={(v) => setAssistGas(v === '_none' ? '' : v)}>
						<SelectTrigger className="h-9">
							<SelectValue placeholder="Seleccionar" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="_none">Sin especificar</SelectItem>
							<SelectItem value="Oxigeno">Oxígeno</SelectItem>
							<SelectItem value="Nitrogeno">Nitrógeno</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="gasConsumption">Consumo gas (L/min)</Label>
					<Input id="gasConsumption" name="gasConsumption" type="number" step="0.1" defaultValue={defaultValues?.gasConsumption ?? ''} />
				</div>
				<div>
					<Label htmlFor="gasPressure">Presión gas (bar)</Label>
					<Input id="gasPressure" name="gasPressure" type="number" step="0.1" defaultValue={defaultValues?.gasPressure ?? ''} />
				</div>
				<div>
					<Label htmlFor="piercingTime">T. perforación (s)</Label>
					<Input id="piercingTime" name="piercingTime" type="number" step="0.01" defaultValue={defaultValues?.piercingTime ?? ''} />
				</div>
				<div>
					<Label htmlFor="piercingDistance">D. perforación (mm)</Label>
					<Input id="piercingDistance" name="piercingDistance" type="number" step="0.1" defaultValue={defaultValues?.piercingDistance ?? ''} />
				</div>
				<div>
					<Label htmlFor="sheetWeight">Peso chapa (kg)</Label>
					<Input id="sheetWeight" name="sheetWeight" type="number" step="0.01" defaultValue={defaultValues?.sheetWeight ?? ''} />
				</div>
				<div>
					<Label htmlFor="finish">Terminación</Label>
					<Input id="finish" name="finish" defaultValue={defaultValues?.finish ?? ''} placeholder="Ej: Laminado en frío" />
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" disabled={saving}>
					{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{submitLabel}
				</Button>
			</div>
		</form>
	);
}

function TypeField({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
			<p className="font-mono text-sm">{value}</p>
		</div>
	);
}
