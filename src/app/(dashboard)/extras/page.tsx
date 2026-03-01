import { getPaginatedExtraServices } from './actions';
import { ExtrasTable } from './extras-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
	title: 'Extras',
	description: 'Gestión de servicios adicionales',
};

type SortField = 'name' | 'price' | 'isActive' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const VALID_SORT_FIELDS: SortField[] = ['name', 'price', 'isActive', 'createdAt'];
const VALID_SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

export default async function ExtrasPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string; sortBy?: string; order?: string }>;
}) {
	const params = await searchParams;
	const page = parseInt(params?.page || '1', 10);
	const sortBy = VALID_SORT_FIELDS.includes(params?.sortBy as SortField)
		? (params?.sortBy as SortField)
		: 'name';
	const order = VALID_SORT_ORDERS.includes(params?.order as SortOrder)
		? (params?.order as SortOrder)
		: 'asc';
	const limit = 10;

	// Get current user role
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const dbUser = user
		? await prisma.user.findUnique({
				where: { id: user.id },
				select: { role: true },
		  })
		: null;

	const isAdmin = dbUser?.role === 'ADMIN';

	const { extras, totalPages, total } = await getPaginatedExtraServices(
		page,
		limit,
		sortBy,
		order
	);

	const activeCount = extras.filter((e) => e.isActive).length;

	return (
		<div className="container mx-auto py-10 space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-2xl">Servicios Adicionales</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Gestiona los extras disponibles para las órdenes
						</p>
					</div>
					{isAdmin && (
						<Button asChild>
							<Link href="/extras/new">
								<Plus className="mr-2 h-4 w-4" />
								Nuevo Servicio
							</Link>
						</Button>
					)}
				</CardHeader>
				<CardContent>
					<ExtrasTable
						extras={extras}
						currentPage={page}
						totalPages={totalPages}
						isAdmin={isAdmin}
					/>

					<div className="mt-6 p-4 bg-muted rounded-lg">
						<h4 className="font-medium mb-2">Resumen</h4>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground">Total de servicios:</span>
								<p className="font-semibold">{total}</p>
							</div>
							<div>
								<span className="text-muted-foreground">
									Activos en esta página:
								</span>
								<p className="font-semibold">{activeCount}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Precio promedio:</span>
								<p className="font-semibold">
									{extras.length > 0
										? formatPrice(
												extras.reduce((sum, e) => sum + e.price, 0) /
												extras.length
										  )
										: '$0'}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
