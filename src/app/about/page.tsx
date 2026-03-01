import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
	Zap,
	Target,
	Users,
	Cpu,
	ArrowRight,
	CheckCircle2,
	Factory,
	Lightbulb,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Acerca de ClicknCut',
	description:
		'Conoce ClicknCut: la plataforma de corte láser diseñada para makers. Cotización instantánea, calidad industrial, entrega rápida.',
};

export default function AboutPage() {
	return (
		<div className='flex flex-col'>
			{/* Hero Section */}
			<section className='py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
					<Badge variant='secondary' className='mb-4'>
						<Users className='size-3' />
						Sobre nosotros
					</Badge>
					<h1 className='text-4xl md:text-5xl font-bold tracking-tight mb-6'>
						Hacemos que el corte industrial sea{' '}
						<span className='text-secondary'>accesible para todos</span>
					</h1>
					<p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
						ClicknCut nació para eliminar las barreras entre tu diseño y la
						realidad. Sin mínimos de orden, sin procesos complicados.
					</p>
				</div>
			</section>

			{/* Mission Section */}
			<section className='py-16 md:py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='grid lg:grid-cols-2 gap-12 items-center'>
						<div className='space-y-6'>
							<div className='inline-flex items-center gap-2 text-sm font-medium text-secondary'>
								<Target className='size-4' />
								Nuestra misión
							</div>
							<h2 className='text-3xl md:text-4xl font-bold tracking-tight'>
								Democratizar la fabricación de precisión
							</h2>
							<div className='space-y-4 text-muted-foreground'>
								<p>
									Durante años, el corte láser fue exclusivo de grandes
									empresas con presupuestos enormes y pedidos mínimos de cientos
									de piezas.
								</p>
								<p>
									Nosotros creemos que cualquier maker, diseñador o emprendedor
									debería poder convertir su idea en realidad sin importar si
									necesita 1 pieza o 1000.
								</p>
								<p>
									<strong className='text-foreground'>
										Por eso creamos ClicknCut:
									</strong>{' '}
									una plataforma que te da cotización instantánea, precios
									transparentes y entrega en días, no semanas.
								</p>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<Card className='col-span-2 sm:col-span-1'>
								<CardContent className='pt-6'>
									<div className='size-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4'>
										<Zap className='size-6 text-secondary' />
									</div>
									<div className='text-3xl font-bold mb-1'>Instantánea</div>
									<p className='text-sm text-muted-foreground'>
										Cotización en segundos, no días
									</p>
								</CardContent>
							</Card>

							<Card className='col-span-2 sm:col-span-1'>
								<CardContent className='pt-6'>
									<div className='size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4'>
										<Factory className='size-6 text-primary' />
									</div>
									<div className='text-3xl font-bold mb-1'>±0.1mm</div>
									<p className='text-sm text-muted-foreground'>
										Precisión industrial garantizada
									</p>
								</CardContent>
							</Card>

							<Card className='col-span-2'>
								<CardContent className='pt-6'>
									<div className='size-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4'>
										<Lightbulb className='size-6 text-secondary' />
									</div>
									<div className='text-3xl font-bold mb-1'>Sin mínimos</div>
									<p className='text-sm text-muted-foreground'>
										Desde 1 pieza hasta producción en serie
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Process Section */}
			<section className='py-16 md:py-20 bg-muted/30'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-2xl mx-auto mb-12'>
						<div className='inline-flex items-center gap-2 text-sm font-medium text-secondary mb-4'>
							<Cpu className='size-4' />
							Nuestro proceso
						</div>
						<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-4'>
							Tecnología al servicio de tu creatividad
						</h2>
						<p className='text-muted-foreground'>
							Combinamos equipos industriales de última generación con software
							inteligente para ofrecerte la mejor experiencia.
						</p>
					</div>

					<div className='grid md:grid-cols-3 gap-8'>
						<div className='space-y-4'>
							<div className='size-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold'>
								1
							</div>
							<h3 className='text-xl font-semibold'>Análisis automático</h3>
							<p className='text-muted-foreground text-sm'>
								Nuestro sistema analiza tu DXF y calcula el tiempo de corte,
								material necesario y precio óptimo en tiempo real.
							</p>
						</div>

						<div className='space-y-4'>
							<div className='size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold'>
								2
							</div>
							<h3 className='text-xl font-semibold'>Corte de precisión</h3>
							<p className='text-muted-foreground text-sm'>
								Utilizamos máquinas láser de fibra y CO2 de última generación
								para garantizar cortes limpios y precisos en cualquier material.
							</p>
						</div>

						<div className='space-y-4'>
							<div className='size-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold'>
								3
							</div>
							<h3 className='text-xl font-semibold'>Control de calidad</h3>
							<p className='text-muted-foreground text-sm'>
								Cada pieza pasa por inspección antes del envío. Si algo no
								cumple con nuestros estándares, lo rehacemos sin costo
								adicional.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Values Section */}
			<section className='py-16 md:py-20'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-2xl mx-auto mb-12'>
						<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-4'>
							Lo que nos diferencia
						</h2>
					</div>

					<div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='p-6 rounded-xl border bg-card'>
							<CheckCircle2 className='size-8 text-secondary mb-4' />
							<h3 className='font-semibold mb-2'>Transparencia total</h3>
							<p className='text-sm text-muted-foreground'>
								Precio cerrado desde el inicio. Sin sorpresas, sin costos
								ocultos.
							</p>
						</div>

						<div className='p-6 rounded-xl border bg-card'>
							<CheckCircle2 className='size-8 text-secondary mb-4' />
							<h3 className='font-semibold mb-2'>Respuesta rápida</h3>
							<p className='text-sm text-muted-foreground'>
								Si tenés dudas, nuestro equipo responde en menos de 24 horas.
							</p>
						</div>

						<div className='p-6 rounded-xl border bg-card'>
							<CheckCircle2 className='size-8 text-secondary mb-4' />
							<h3 className='font-semibold mb-2'>Garantía de calidad</h3>
							<p className='text-sm text-muted-foreground'>
								Si tu pieza no cumple con las especificaciones, la rehacemos
								gratis.
							</p>
						</div>

						<div className='p-6 rounded-xl border bg-card'>
							<CheckCircle2 className='size-8 text-secondary mb-4' />
							<h3 className='font-semibold mb-2'>Envío seguro</h3>
							<p className='text-sm text-muted-foreground'>
								Embalaje profesional y tracking en tiempo real hasta tu puerta.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-16 md:py-20 bg-primary text-primary-foreground'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8'>
					<h2 className='text-3xl md:text-4xl font-bold tracking-tight'>
						¿Listo para crear tu próximo proyecto?
					</h2>
					<p className='text-lg text-primary-foreground/90 max-w-2xl mx-auto'>
						Sube tu diseño y obtené una cotización instantánea. Es gratis y sin
						compromiso.
					</p>
					<Button asChild size='lg' variant='secondary' className='text-base'>
						<Link href='/quoting'>
							Cotizar ahora
							<ArrowRight />
						</Link>
					</Button>
				</div>
			</section>
		</div>
	);
}
