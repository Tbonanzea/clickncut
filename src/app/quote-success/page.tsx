'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, MessageCircle, Home, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function SuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const orderId = searchParams.get('orderId');
	const [orderData, setOrderData] = useState<any>(null);
	const [_loading, setLoading] = useState(true);

	useEffect(() => {
		if (!orderId) {
			router.push('/quoting');
			return;
		}

		async function fetchOrder() {
			try {
				const response = await fetch(`/api/orders`);
				if (response.ok) {
					const data = await response.json();
					const order = data.orders?.find((o: any) => o.id === orderId);
					if (order) {
						setOrderData(order);
					}
				}
			} catch (error) {
				console.error('Error fetching order:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchOrder();
	}, [orderId, router]);

	if (!orderId) {
		return null;
	}

	// WhatsApp contact link with pre-filled message
	const whatsappNumber = '5491234567890'; // TODO: Replace with actual number from env
	const whatsappMessage = encodeURIComponent(
		`Hola! Acabo de enviar una cotización (Orden #${orderId}). Me gustaría obtener más información.`
	);
	const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Success Header */}
			<Card className="border-green-200 bg-green-50">
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<div className="flex-shrink-0">
							<CheckCircle2 className="h-12 w-12 text-success" />
						</div>
						<div className="flex-1">
							<h1 className="text-2xl font-bold text-green-900">
								¡Cotización Enviada Exitosamente!
							</h1>
							<p className="text-green-700 mt-1">
								Tu solicitud ha sido recibida y está siendo procesada.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Order Details */}
			<Card>
				<CardHeader>
					<CardTitle>Detalles de tu Orden</CardTitle>
					<CardDescription>
						Guarda este número de orden para futuras referencias
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
						<div>
							<p className="text-sm text-muted-foreground">Número de Orden</p>
							<p className="text-xl font-mono font-bold text-slate-900">
								#{orderId.slice(0, 8).toUpperCase()}
							</p>
						</div>
						{orderData && (
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Total Estimado</p>
								<p className="text-xl font-bold text-success">
									${orderData.totalPrice?.toFixed(2)}
								</p>
							</div>
						)}
					</div>

					<Separator />

					<div className="space-y-2">
						<h3 className="font-semibold text-slate-900">Próximos Pasos:</h3>
						<ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
							<li>
								Recibirás un email de confirmación con los detalles de tu
								cotización
							</li>
							<li>
								Nuestro equipo revisará tu diseño y te enviará una cotización
								detallada en 24-48 horas
							</li>
							<li>
								Una vez aprobada, podrás proceder con el pago y la producción
							</li>
							<li>
								Te mantendremos informado sobre el estado de tu orden por email
							</li>
						</ol>
					</div>
				</CardContent>
			</Card>

			{/* Payment CTA */}
			<Card className="border-blue-500 bg-blue-50">
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div>
							<h3 className="font-semibold text-blue-900">
								¿Listo para pagar?
							</h3>
							<p className="text-sm text-blue-700">
								Procede al checkout para completar tu orden
							</p>
						</div>
						<Button
							size="lg"
							className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
							onClick={() => router.push(`/checkout?orderId=${orderId}`)}
						>
							<CreditCard className="mr-2 h-5 w-5" />
							Ir al Checkout
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Email Confirmation Notice */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="pt-6">
					<div className="flex items-start gap-3">
						<Mail className="h-5 w-5 text-blue-600 mt-0.5" />
						<div>
							<h3 className="font-semibold text-blue-900">
								Revisa tu Email
							</h3>
							<p className="text-sm text-blue-700 mt-1">
								Te hemos enviado un email de confirmación con todos los
								detalles de tu cotización. Si no lo encuentras, revisa tu
								carpeta de spam.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Contact Options */}
			<Card>
				<CardHeader>
					<CardTitle>¿Necesitas Ayuda?</CardTitle>
					<CardDescription>
						Estamos aquí para responder tus preguntas
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Button
						variant="default"
						className="w-full bg-green-600 hover:bg-green-700"
						onClick={() => window.open(whatsappLink, '_blank')}
					>
						<MessageCircle className="mr-2 h-5 w-5" />
						Contactar por WhatsApp
					</Button>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => router.push('/')}
					>
						<Home className="mr-2 h-5 w-5" />
						Volver al Inicio
					</Button>
				</CardContent>
			</Card>

			{/* Additional Info */}
			<Card>
				<CardContent className="pt-6">
					<h3 className="font-semibold text-slate-900 mb-3">
						Información Adicional
					</h3>
					<div className="space-y-2 text-sm text-gray-700">
						<p>
							<strong>Tiempo de respuesta:</strong> 24-48 horas hábiles para
							cotización detallada
						</p>
						<p>
							<strong>Tiempo de producción:</strong> Depende de la complejidad
							del proyecto (típicamente 3-7 días)
						</p>
						<p>
							<strong>Validez de la cotización:</strong> 30 días desde la fecha
							de emisión
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function QuoteSuccessPage() {
	return (
		<div className="container py-8">
			<Suspense fallback={<div className="text-center py-12">Loading...</div>}>
				<SuccessContent />
			</Suspense>
		</div>
	);
}
