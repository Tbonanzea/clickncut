'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrderById, updateOrderStatus, OrderWithDetails } from '../actions';
import { OrderStatus } from '@/generated/prisma/browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Loader2, CreditCard, Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice } from '@/lib/format';

const statusColors: Record<OrderStatus, string> = {
	PENDING: 'bg-yellow-100 text-yellow-800',
	PAID: 'bg-blue-100 text-blue-800',
	SHIPPED: 'bg-purple-100 text-purple-800',
	COMPLETED: 'bg-green-100 text-green-800',
	CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<OrderStatus, string> = {
	PENDING: 'Pendiente',
	PAID: 'Pagado',
	SHIPPED: 'Enviado',
	COMPLETED: 'Completado',
	CANCELLED: 'Cancelado',
};

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
	PENDING: 'PAID',
	PAID: 'SHIPPED',
	SHIPPED: 'COMPLETED',
};

const nextStatusLabels: Record<string, string> = {
	PAID: 'Marcar como Pagado',
	SHIPPED: 'Marcar como Enviado',
	COMPLETED: 'Marcar como Completado',
};

export default function OrderDetailPage() {
	const params = useParams();
	const [order, setOrder] = useState<OrderWithDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [confirmingTransfer, setConfirmingTransfer] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const orderId = params.id as string;

	useEffect(() => {
		async function fetchOrder() {
			const result = await getOrderById(orderId);
			if (result.success && result.order) {
				setOrder(result.order);
			} else {
				setError(result.error || 'Error al cargar la orden');
			}
			setLoading(false);
		}
		fetchOrder();
	}, [orderId]);

	const handleStatusChange = async (newStatus: OrderStatus) => {
		setUpdating(true);
		setError(null);
		const result = await updateOrderStatus(orderId, newStatus);
		if (result.success && result.order) {
			setOrder((prev) => (prev ? { ...prev, status: result.order!.status } : null));
		} else {
			setError(result.error || 'Error al actualizar el estado');
		}
		setUpdating(false);
	};

	const handleConfirmTransfer = async (paymentId: string) => {
		setConfirmingTransfer(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch('/api/payments/confirm-transfer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paymentId }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Error al confirmar transferencia');
			}

			// Refresh order data
			const result = await getOrderById(orderId);
			if (result.success && result.order) {
				setOrder(result.order);
			}
			setSuccess('Transferencia confirmada exitosamente');
		} catch (err: any) {
			setError(err.message || 'Error al confirmar transferencia');
		} finally {
			setConfirmingTransfer(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="container mx-auto py-10">
				<Card>
					<CardContent className="py-10">
						<div className="text-center text-destructive">
							{error || 'Orden no encontrada'}
						</div>
						<div className="text-center mt-4">
							<Button asChild variant="outline">
								<Link href="/orders">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Volver a órdenes
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const nextStatus = nextStatusMap[order.status];
	const canCancel = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';

	// Find pending transfer payment (used in UI)
	const _pendingTransfer = order.payments?.find(
		(p) => p.paymentMethod === 'TRANSFER' && p.status === 'PENDING'
	);

	// Get payment status info
	const getPaymentStatusIcon = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return <CheckCircle2 className="h-4 w-4 text-success" />;
			case 'FAILED':
				return <XCircle className="h-4 w-4 text-destructive" />;
			default:
				return <Clock className="h-4 w-4 text-yellow-600" />;
		}
	};

	const getPaymentStatusLabel = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return 'Completado';
			case 'FAILED':
				return 'Fallido';
			default:
				return 'Pendiente';
		}
	};

	const getPaymentMethodLabel = (method: string) => {
		switch (method) {
			case 'MERCADOPAGO':
				return 'MercadoPago';
			case 'TRANSFER':
				return 'Transferencia Bancaria';
			default:
				return method;
		}
	};

	return (
		<div className="container mx-auto py-10 space-y-6">
			{/* Error/Success Messages */}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{success && (
				<Alert className="border-green-200 bg-green-50">
					<CheckCircle2 className="h-4 w-4 text-success" />
					<AlertDescription className="text-green-800">{success}</AlertDescription>
				</Alert>
			)}

			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button asChild variant="ghost" size="sm">
						<Link href="/orders">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Volver
						</Link>
					</Button>
					<h1 className="text-2xl font-bold">Orden #{order.id.slice(0, 8)}</h1>
					<Badge variant="secondary" className={statusColors[order.status]}>
						{statusLabels[order.status]}
					</Badge>
				</div>
				<div className="flex gap-2">
					{nextStatus && (
						<Button
							onClick={() => handleStatusChange(nextStatus)}
							disabled={updating}
						>
							{updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{nextStatusLabels[nextStatus]}
						</Button>
					)}
					{canCancel && (
						<Button
							variant="destructive"
							onClick={() => handleStatusChange('CANCELLED')}
							disabled={updating}
						>
							Cancelar Orden
						</Button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Order Info */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Información de la Orden</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">ID completo</span>
							<p className="font-mono text-sm">{order.id}</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Fecha de creación</span>
							<p>
								{format(new Date(order.createdAt), "d 'de' MMMM, yyyy HH:mm", {
									locale: es,
								})}
							</p>
							<p className="text-xs text-gray-400">
								{formatDistanceToNow(new Date(order.createdAt), {
									addSuffix: true,
									locale: es,
								})}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Última actualización</span>
							<p className="text-sm">
								{formatDistanceToNow(new Date(order.updatedAt), {
									addSuffix: true,
									locale: es,
								})}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Customer Info */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Cliente</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Nombre</span>
							<p className="font-medium">
								{order.user.firstName && order.user.lastName
									? `${order.user.firstName} ${order.user.lastName}`
									: 'Sin nombre'}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Email</span>
							<p>{order.user.email}</p>
						</div>
						<Button asChild variant="outline" size="sm" className="w-full">
							<Link href={`/users?search=${order.user.email}`}>
								Ver perfil del cliente
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Order Summary */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Resumen</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Total de items</span>
							<p className="text-2xl font-bold">{order.items.length}</p>
						</div>
						<Separator />
						<div>
							<span className="text-sm text-muted-foreground">Total</span>
							<p className="text-3xl font-bold text-success">
								{formatPrice(order.totalPrice, 2)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Order Items */}
			<Card>
				<CardHeader>
					<CardTitle>Items de la Orden</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Archivo</TableHead>
								<TableHead>Material</TableHead>
								<TableHead>Dimensiones</TableHead>
								<TableHead className="text-center">Cantidad</TableHead>
								<TableHead className="text-right">Precio Unit.</TableHead>
								<TableHead className="text-right">Subtotal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{order.items.map((item) => (
								<TableRow key={item.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											<span className="font-medium">{item.file.filename}</span>
											<Button
												asChild
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
											>
												<a
													href={`/api/file?key=${encodeURIComponent(item.file.filepath)}`}
													target="_blank"
													rel="noopener noreferrer"
													download={item.file.filename}
												>
													<ExternalLink className="h-3 w-3" />
												</a>
											</Button>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<p className="font-medium">
												{item.materialType.material.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{item.materialType.height}mm espesor
											</p>
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm">
											{item.materialType.width} x {item.materialType.length} mm
										</span>
									</TableCell>
									<TableCell className="text-center">{item.quantity}</TableCell>
									<TableCell className="text-right">
										{formatPrice(item.price, 2)}
									</TableCell>
									<TableCell className="text-right font-semibold">
										{formatPrice(item.price * item.quantity, 2)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<Separator className="my-4" />

					<div className="flex justify-end">
						<div className="w-64 space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span>
									{formatPrice(order.totalPrice, 2)}
								</span>
							</div>
							<Separator />
							<div className="flex justify-between font-bold text-lg">
								<span>Total</span>
								<span className="text-success">
									{formatPrice(order.totalPrice, 2)}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payments Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Pagos
					</CardTitle>
				</CardHeader>
				<CardContent>
					{order.payments && order.payments.length > 0 ? (
						<div className="space-y-4">
							{order.payments.map((payment) => (
								<div
									key={payment.id}
									className="flex items-center justify-between p-4 bg-muted rounded-lg"
								>
									<div className="flex items-center gap-4">
										{payment.paymentMethod === 'MERCADOPAGO' ? (
											<CreditCard className="h-8 w-8 text-blue-600" />
										) : (
											<Building2 className="h-8 w-8 text-emerald-600" />
										)}
										<div>
											<p className="font-medium">
												{getPaymentMethodLabel(payment.paymentMethod)}
											</p>
											<p className="text-sm text-muted-foreground">
												{formatPrice(payment.amount, 2)}
											</p>
											{payment.paidAt && (
												<p className="text-xs text-gray-400">
													Pagado: {format(new Date(payment.paidAt), "d/MM/yyyy HH:mm", { locale: es })}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2">
											{getPaymentStatusIcon(payment.status)}
											<span className="text-sm">{getPaymentStatusLabel(payment.status)}</span>
										</div>
										{payment.paymentMethod === 'TRANSFER' && payment.status === 'PENDING' && (
											<Button
												size="sm"
												onClick={() => handleConfirmTransfer(payment.id)}
												disabled={confirmingTransfer}
											>
												{confirmingTransfer ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<CheckCircle2 className="mr-2 h-4 w-4" />
												)}
												Confirmar Pago
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
							<p>No hay pagos registrados para esta orden</p>
							{order.status === 'PENDING' && (
								<p className="text-sm mt-2">
									El cliente aun no ha iniciado el proceso de pago
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Extras Section */}
			{order.extras && order.extras.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Servicios Adicionales</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{order.extras.map((extra) => (
								<div key={extra.id} className="flex justify-between items-center p-3 bg-muted rounded">
									<span>{extra.extraService.name}</span>
									<span className="font-medium">
										{formatPrice(extra.priceAtOrder, 2)}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
