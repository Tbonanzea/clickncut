'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Clock,
	Home,
	FileText,
	MessageCircle,
	Loader2,
	Copy,
	Check,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const bankInfo = {
	holder: process.env.NEXT_PUBLIC_BANK_HOLDER || '',
	cbu: process.env.NEXT_PUBLIC_BANK_CBU || '',
	alias: process.env.NEXT_PUBLIC_BANK_ALIAS || '',
	bank: process.env.NEXT_PUBLIC_BANK_NAME || '',
};

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			onClick={handleCopy}
			className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
			title="Copiar"
		>
			{copied ? (
				<Check className="h-4 w-4 text-green-600" />
			) : (
				<Copy className="h-4 w-4" />
			)}
		</button>
	);
}

function PendingContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const orderId = searchParams.get('orderId');
	const amount = searchParams.get('amount');
	const orderLabel = orderId?.slice(0, 8).toUpperCase() || '';
	const formattedAmount = amount
		? `$${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
		: null;

	const whatsappNumber =
		process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5491234567890';
	const whatsappMessage = encodeURIComponent(
		`Hola! Ya realicé la transferencia por ${formattedAmount || 'el monto indicado'} para la orden #${orderLabel}.`
	);
	const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<Card className="border-yellow-200 bg-yellow-50">
				<CardContent className="pt-6">
					<div className="flex items-center gap-4">
						<Clock className="h-14 w-14 text-yellow-600 flex-shrink-0" />
						<div>
							<h1 className="text-2xl font-bold text-yellow-900">
								Orden Registrada
							</h1>
							<p className="text-yellow-700 mt-1">
								Realizá la transferencia para confirmar tu pedido
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Order info + amount */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">
								Orden
							</p>
							<p className="text-lg font-mono font-bold">
								#{orderLabel}
							</p>
						</div>
						{formattedAmount && (
							<div className="text-right">
								<p className="text-sm text-muted-foreground">
									Total a transferir
								</p>
								<p className="text-2xl font-bold text-emerald-600">
									{formattedAmount}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Bank details */}
			<Card>
				<CardHeader>
					<CardTitle>Datos para la transferencia</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{bankInfo.holder && (
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Titular
								</p>
								<p className="font-medium">{bankInfo.holder}</p>
							</div>
						</div>
					)}

					{bankInfo.cbu && (
						<>
							<Separator />
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										CBU
									</p>
									<p className="font-mono font-medium">
										{bankInfo.cbu}
									</p>
								</div>
								<CopyButton text={bankInfo.cbu} />
							</div>
						</>
					)}

					{bankInfo.alias && (
						<>
							<Separator />
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										Alias
									</p>
									<p className="font-medium">
										{bankInfo.alias}
									</p>
								</div>
								<CopyButton text={bankInfo.alias} />
							</div>
						</>
					)}

					{bankInfo.bank && (
						<>
							<Separator />
							<div>
								<p className="text-sm text-muted-foreground">
									Banco
								</p>
								<p className="font-medium">{bankInfo.bank}</p>
							</div>
						</>
					)}

					{formattedAmount && (
						<>
							<Separator />
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										Monto
									</p>
									<p className="font-bold text-lg text-emerald-600">
										{formattedAmount}
									</p>
								</div>
								<CopyButton text={amount!} />
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Steps */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="pt-6">
					<h3 className="font-semibold text-blue-900 mb-3">
						Pasos a seguir
					</h3>
					<ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
						<li>
							Realizá la transferencia con los datos de arriba
						</li>
						<li>
							Avisanos por WhatsApp que ya transferiste
						</li>
						<li>
							Verificamos el pago y confirmamos tu pedido
						</li>
						<li>
							Te notificamos por email cuando esté confirmado
						</li>
					</ol>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="space-y-3">
				<Button
					className="w-full bg-green-600 hover:bg-green-700 text-white"
					size="lg"
					onClick={() => window.open(whatsappLink, '_blank')}
				>
					<MessageCircle className="mr-2 h-5 w-5" />
					Ya transferí, avisar por WhatsApp
				</Button>
				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="outline"
						className="w-full"
						onClick={() => router.push('/my-orders')}
					>
						<FileText className="mr-2 h-4 w-4" />
						Mis ordenes
					</Button>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => router.push('/')}
					>
						<Home className="mr-2 h-4 w-4" />
						Volver al inicio
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function CheckoutPendingPage() {
	return (
		<div className="container py-8">
			<Suspense
				fallback={
					<div className="flex items-center justify-center min-h-[400px]">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				}
			>
				<PendingContent />
			</Suspense>
		</div>
	);
}
