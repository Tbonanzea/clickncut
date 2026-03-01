import { getDashboardMetrics } from './actions';
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
import {
	ShoppingCart,
	DollarSign,
	Users,
	Clock,
	TrendingUp,
	CheckCircle,
	Package,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusVariant, getStatusLabel } from '@/lib/status-utils';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
	title: 'Dashboard',
	description: 'Panel de control con métricas del negocio',
};

export default async function DashboardPage() {
	const metrics = await getDashboardMetrics();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground mt-1">
					Resumen general del negocio
				</p>
			</div>

			{/* Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Órdenes Totales
						</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalOrders}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{metrics.pendingOrders} pendientes
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Ingresos Totales
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatPrice(metrics.totalRevenue, 2)}
						</div>
						<p className="text-xs text-success mt-1">
							+{formatPrice(metrics.revenueThisMonth, 2)}{' '}
							este mes
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Usuarios Registrados
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.totalUsers}</div>
						<p className="text-xs text-success mt-1">
							+{metrics.newUsersThisMonth} este mes
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Órdenes Completadas
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.completedOrders}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{metrics.paidOrders} pagadas pendientes de envío
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="border-status-pending/30 bg-status-pending/10">
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-status-pending/20 rounded-full">
								<Clock className="h-6 w-6 text-status-pending-foreground" />
							</div>
							<div>
								<p className="text-sm text-status-pending-foreground font-medium">
									Pendientes de Pago
								</p>
								<p className="text-2xl font-bold text-status-pending-foreground">
									{metrics.pendingOrders}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-status-paid/30 bg-status-paid/10">
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-status-paid/20 rounded-full">
								<Package className="h-6 w-6 text-status-paid-foreground" />
							</div>
							<div>
								<p className="text-sm text-status-paid-foreground font-medium">
									Listas para Enviar
								</p>
								<p className="text-2xl font-bold text-status-paid-foreground">
									{metrics.paidOrders}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-success/30 bg-success/10">
					<CardContent className="pt-6">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-success/20 rounded-full">
								<TrendingUp className="h-6 w-6 text-success" />
							</div>
							<div>
								<p className="text-sm text-success font-medium">
									Ingresos del Mes
								</p>
								<p className="text-2xl font-bold text-success">
									{formatPrice(metrics.revenueThisMonth)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Orders */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Órdenes Recientes</CardTitle>
					<Button asChild variant="outline" size="sm">
						<Link href="/orders">Ver todas</Link>
					</Button>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="text-right">Total</TableHead>
								<TableHead>Fecha</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{metrics.recentOrders.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center text-muted-foreground py-8"
									>
										No hay órdenes aún
									</TableCell>
								</TableRow>
							) : (
								metrics.recentOrders.map((order) => (
									<TableRow key={order.id}>
										<TableCell>
											<code className="text-xs bg-muted px-2 py-1 rounded">
												{order.id.slice(0, 8)}
											</code>
										</TableCell>
										<TableCell>
											{order.user.firstName && order.user.lastName
												? `${order.user.firstName} ${order.user.lastName}`
												: order.user.email}
										</TableCell>
										<TableCell>
											<Badge variant={getStatusVariant(order.status)}>
												{getStatusLabel(order.status)}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-semibold">
											{formatPrice(order.totalPrice, 2)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{formatDistanceToNow(new Date(order.createdAt), {
												addSuffix: true,
												locale: es,
											})}
										</TableCell>
										<TableCell>
											<Button asChild variant="ghost" size="sm">
												<Link href={`/orders/${order.id}`}>Ver</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
