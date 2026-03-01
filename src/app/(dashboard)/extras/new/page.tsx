'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createExtraService } from '../actions';
import { PriceInput } from '@/components/ui/price-input';
import { parseFormattedNumber } from '@/lib/format';

export default function NewExtraPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get('name') as string,
			description: formData.get('description') as string,
			price: parseFormattedNumber(formData.get('price') as string),
			unit: formData.get('unit') as string,
		};

		const result = await createExtraService(data);

		if (result.success) {
			router.push('/extras');
		} else {
			setError(result.error || 'Error al crear el servicio');
			setLoading(false);
		}
	};

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
					<CardTitle>Nuevo Servicio Adicional</CardTitle>
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
								placeholder="Ej: Grabado láser"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción</Label>
							<Input
								id="description"
								name="description"
								placeholder="Descripción del servicio"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="price">Precio ($) *</Label>
								<PriceInput
									id="price"
									name="price"
									placeholder="0"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="unit">Unidad *</Label>
								<select
									id="unit"
									name="unit"
									className="w-full h-10 px-3 border rounded-md"
									required
								>
									<option value="por pieza">por pieza</option>
									<option value="por proyecto">por proyecto</option>
									<option value="por pedido">por pedido</option>
								</select>
							</div>
						</div>

						<div className="flex justify-end gap-4">
							<Button type="button" variant="outline" asChild>
								<Link href="/extras">Cancelar</Link>
							</Button>
							<Button type="submit" disabled={loading}>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Crear Servicio
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
