'use client';

import { Order, OrderStatus } from '@/generated/prisma/browser';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusVariant, getStatusLabel } from '@/lib/status-utils';
import { formatPrice } from '@/lib/format';

type MyOrder = Order & {
	_count: {
		items: number;
	};
};

export const columns: ColumnDef<MyOrder>[] = [
	{
		accessorKey: 'id',
		header: 'Número de Orden',
		cell: ({ row }) => {
			const id = row.original.id;
			return (
				<code className="text-xs bg-muted px-2 py-1 rounded">
					#{id.slice(0, 8)}...
				</code>
			);
		},
	},
	{
		accessorKey: 'items',
		header: 'Items',
		cell: ({ row }) => {
			const count = row.original._count.items;
			return <div className="text-center">{count}</div>;
		},
	},
	{
		accessorKey: 'totalPrice',
		header: 'Total',
		cell: ({ row }) => {
			const price = row.original.totalPrice;
			return (
				<div className="font-semibold">
					{formatPrice(price, 2)}
				</div>
			);
		},
	},
	{
		accessorKey: 'status',
		header: 'Estado',
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<Badge variant={getStatusVariant(status)}>
					{getStatusLabel(status)}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Fecha',
		cell: ({ row }) => {
			const date = new Date(row.original.createdAt);
			return (
				<div className="text-sm text-muted-foreground">
					{formatDistanceToNow(date, { addSuffix: true, locale: es })}
				</div>
			);
		},
	},
	{
		id: 'actions',
		header: 'Acciones',
		cell: ({ row }) => {
			const id = row.original.id;
			return (
				<Button asChild variant="outline" size="sm">
					<Link href={`/my-orders/${id}`}>Ver detalle</Link>
				</Button>
			);
		},
	},
];
