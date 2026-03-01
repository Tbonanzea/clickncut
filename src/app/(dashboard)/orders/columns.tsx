'use client';

import { Order, OrderStatus, User } from '@/generated/prisma/browser';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusVariant, getStatusLabel } from '@/lib/status-utils';
import { formatPrice } from '@/lib/format';

export type OrderWithUser = Order & {
	user: Pick<User, 'email' | 'firstName' | 'lastName'>;
	_count: {
		items: number;
	};
};

export const statusOptions = [
	{ value: 'PENDING', label: 'Pendiente' },
	{ value: 'PAID', label: 'Pagado' },
	{ value: 'SHIPPED', label: 'Enviado' },
	{ value: 'COMPLETED', label: 'Completado' },
	{ value: 'CANCELLED', label: 'Cancelado' },
];

export const columns: ColumnDef<OrderWithUser>[] = [
	{
		accessorKey: 'id',
		header: 'ID',
		cell: ({ row }) => {
			const id = row.original.id;
			return (
				<code className="text-xs bg-muted px-2 py-1 rounded">
					{id.slice(0, 8)}...
				</code>
			);
		},
	},
	{
		accessorKey: 'user',
		header: 'Cliente',
		cell: ({ row }) => {
			const user = row.original.user;
			const name =
				user.firstName && user.lastName
					? `${user.firstName} ${user.lastName}`
					: user.email;
			return <div className="font-medium">{name}</div>;
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
		header: 'Creado',
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
					<Link href={`/orders/${id}`}>Ver detalle</Link>
				</Button>
			);
		},
	},
];
