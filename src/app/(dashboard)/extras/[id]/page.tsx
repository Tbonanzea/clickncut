'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { getExtraServiceById, updateExtraService } from '../actions';
import { ExtraService } from '@/generated/prisma/browser';
import { PriceInput } from '@/components/ui/price-input';
import { parseFormattedNumber } from '@/lib/format';

export default function EditExtraPage() {
	const params = useParams();
	const router = useRouter();
	const extraId = params.id as string;

	const [extra, setExtra] = useState<ExtraService | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchExtra() {
			const result = await getExtraServiceById(extraId);
			setExtra(result);
			setLoading(false);
		}
		fetchExtra();
	}, [extraId]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			price: parseFormattedNumber(formData.get('price') as string),
			unit: formData.get('unit') as string,
			isActive: formData.get('isActive') === 'on',
		};

		const result = await updateExtraService(extraId, data);

		if (result.success) {
			router.push('/extras');
		} else {
			setError(result.error || 'Error al actualizar');
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!extra) {
		return (
			<div className="container mx-auto py-10">
				<Card>
					<CardContent className="py-10 text-center">
						<p className="text-destructive">Servicio no encontrado</p>
						<Button asChild variant="outline" className="mt-4">
							<Link href="/extras">Volver a extras</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-10 max-w-2xl">
			<div className="mb-6">
				<Button asChild variant="ghost" size="sm">
					<Link href="/extras">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Volver a extras
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Editar Servicio</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="name">Nombre *</Label>
							<Input
								id="name"
								name="name"
								defaultValue={extra.name}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción</Label>
							<Input
								id="description"
								name="description"
								defaultValue={extra.description || ''}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="price">Precio ($) *</Label>
								<PriceInput
									id="price"
									name="price"
									defaultValue={extra.price}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="unit">Unidad *</Label>
								<select
									id="unit"
									name="unit"
									className="w-full h-10 px-3 border rounded-md"
									defaultValue={extra.unit}
									required
								>
									<option value="por pieza">por pieza</option>
									<option value="por proyecto">por proyecto</option>
									<option value="por pedido">por pedido</option>
								</select>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Switch
								id="isActive"
								name="isActive"
								defaultChecked={extra.isActive}
							/>
							<Label htmlFor="isActive">Servicio activo</Label>
						</div>

						<div className="flex justify-end gap-4">
							<Button type="button" variant="outline" asChild>
								<Link href="/extras">Cancelar</Link>
							</Button>
							<Button type="submit" disabled={saving}>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								<Save className="mr-2 h-4 w-4" />
								Guardar Cambios
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
