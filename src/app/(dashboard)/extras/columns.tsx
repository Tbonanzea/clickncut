'use client';

import { ExtraService } from '@/generated/prisma/browser';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';

export type ExtraServiceWithStats = ExtraService & {
	_count: {
		orderExtras: number;
	};
};

export const unitOptions = [
	{ value: 'por pieza', label: 'Por pieza' },
	{ value: 'por proyecto', label: 'Por proyecto' },
	{ value: 'por pedido', label: 'Por pedido' },
];

export const activeOptions = [
	{ value: 'true', label: 'Activo' },
	{ value: 'false', label: 'Inactivo' },
];

export const columns: ColumnDef<ExtraServiceWithStats>[] = [
	{
		accessorKey: 'name',
		header: 'Nombre',
		cell: ({ row }) => (
			<div className="font-medium">{row.original.name}</div>
		),
	},
	{
		accessorKey: 'description',
		header: 'Descripción',
		cell: ({ row }) => (
			<div className="text-muted-foreground max-w-xs truncate">
				{row.original.description || '-'}
			</div>
		),
	},
	{
		accessorKey: 'price',
		header: 'Precio',
		cell: ({ row }) => (
			<div className="font-semibold text-right">
				{formatPrice(row.original.price)}
			</div>
		),
	},
	{
		accessorKey: 'unit',
		header: 'Unidad',
		cell: ({ row }) => (
			<Badge variant="secondary">{row.original.unit}</Badge>
		),
	},
	{
		accessorKey: 'isActive',
		header: 'Estado',
		cell: ({ row }) => {
			const isActive = row.original.isActive;
			return (
				<Badge
					variant={isActive ? 'default' : 'outline'}
					className={
						isActive
							? 'bg-green-100 text-green-800'
							: 'bg-muted text-muted-foreground'
					}
				>
					{isActive ? 'Activo' : 'Inactivo'}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'orderExtras',
		header: 'Usos',
		cell: ({ row }) => (
			<div className="text-center">{row.original._count.orderExtras}</div>
		),
	},
];
