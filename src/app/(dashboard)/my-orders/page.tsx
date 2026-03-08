import { getMyOrders } from '@/app/(dashboard)/my-orders/actions';
import { columns } from './columns';
import { DataTable } from '@/app/(dashboard)/users/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { OrderStatus } from '@/generated/prisma/client';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import OrdersFilter from './orders-filter';

export const metadata: Metadata = {
	title: 'Mis Órdenes',
	description: 'Historial de tus órdenes y pedidos',
};

export default async function MyOrdersPage({
	searchParams,
}: {
	searchParams?: Promise<{ page?: string; status?: string }>;
}) {
	const params = await searchParams;
	const page = parseInt(params?.page || '1', 10);
	const status = (params?.status || 'ALL') as OrderStatus | 'ALL';
	const limit = 10;

	const { orders, totalPages, total } = await getMyOrders(page, limit, status);

	return (
		<div className="container mx-auto py-10">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Mis Órdenes</CardTitle>
					<CardDescription>
						{total === 0
							? 'No tienes órdenes aún'
							: `Tienes ${total} ${total === 1 ? 'orden' : 'órdenes'}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Suspense fallback={<div>Cargando filtros...</div>}>
						<OrdersFilter currentStatus={status} />
					</Suspense>

					{orders.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground mb-4">No tienes órdenes todavía</p>
							<Button asChild>
								<Link href="/quoting">Ir al cotizador</Link>
							</Button>
						</div>
					) : (
						<div className="mt-6">
							<DataTable
								columns={columns}
								data={orders}
								currentPage={page}
								totalPages={totalPages}
								baseUrl="/my-orders"
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
