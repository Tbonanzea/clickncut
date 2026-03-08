import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ArrowRight,
	CheckCircle2,
	Clock,
	FileText,
	Layers,
	Package,
	Settings,
	ShieldCheck,
	Sparkles,
	Truck,
	Upload,
	Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
	return (
		<div className='flex flex-col'>
			{/* Hero Section */}
			<section className='relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/10'>
				<div className='absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]' />

				<div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32'>
					<div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
						{/* Left Column - Copy */}
						<div className='space-y-8'>
							<div className='space-y-5'>
								<Badge variant='secondary' className='w-fit'>
									<Zap className='size-3' />
									Cotización instantánea
								</Badge>

								<h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground'>
									Corte láser{' '}
									<span className='text-secondary'>
										para makers
									</span>
								</h1>

								<p className='text-lg md:text-xl text-muted-foreground max-w-xl'>
									Sube tu DXF, elige el material y recibe tu
									pieza cortada con precisión. Sin
									complicaciones, sin esperas innecesarias.
								</p>
							</div>

							<div className='flex flex-col sm:flex-row gap-4 pt-2'>
								<Button
									asChild
									size='lg'
									className='text-base shadow-lg hover:shadow-xl transition-shadow'
								>
									<Link href='/quoting'>
										Cotizar ahora
										<ArrowRight className='ml-2' />
									</Link>
								</Button>

								<Button
									asChild
									variant='outline'
									size='lg'
									className='text-base'
								>
									<Link href='#como-funciona'>
										Cómo funciona
									</Link>
								</Button>
							</div>

							{/* Trust indicators */}
							<div className='flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground'>
								<div className='flex items-center gap-2'>
									<CheckCircle2 className='size-5 text-secondary' />
									<span>Entrega 5-7 días</span>
								</div>
								<div className='flex items-center gap-2'>
									<CheckCircle2 className='size-5 text-secondary' />
									<span>5 materiales disponibles</span>
								</div>
								<div className='flex items-center gap-2'>
									<CheckCircle2 className='size-5 text-secondary' />
									<span>Precisión ±0.1mm</span>
								</div>
							</div>
						</div>

						{/* Right Column - Visual */}
						<div className='relative lg:h-[500px] hidden lg:block'>
							{/* Decorative gradient boxes */}
							<div className='absolute top-12 right-12 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl rotate-6 blur-2xl' />
							<div className='absolute bottom-8 left-8 w-64 h-64 bg-gradient-to-tr from-secondary/30 to-primary/10 rounded-2xl -rotate-12 blur-2xl' />

							{/* Floating cards */}
							<div className='relative h-full flex items-center justify-center'>
								<Card className='absolute top-16 right-20 w-48 rotate-6 shadow-xl hover:rotate-3 transition-transform'>
									<CardHeader className='pb-3'>
										<div className='flex items-center gap-2'>
											<div className='size-10 rounded-lg bg-secondary/10 flex items-center justify-center'>
												<FileText className='size-5 text-secondary' />
											</div>
											<CardTitle className='text-sm'>
												Upload DXF
											</CardTitle>
										</div>
									</CardHeader>
									<CardContent>
										<div className='h-2 bg-muted rounded-full overflow-hidden'>
											<div className='h-full w-4/5 bg-secondary rounded-full' />
										</div>
									</CardContent>
								</Card>

								<Card className='absolute top-48 left-16 w-52 -rotate-3 shadow-xl hover:rotate-0 transition-transform'>
									<CardHeader className='pb-3'>
										<div className='flex items-center gap-2'>
											<div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center'>
												<Settings className='size-5 text-primary' />
											</div>
											<CardTitle className='text-sm'>
												Material
											</CardTitle>
										</div>
									</CardHeader>
									<CardContent className='space-y-2'>
										<Badge
											variant='outline'
											className='text-xs'
										>
											Acero Inox
										</Badge>
										<Badge
											variant='outline'
											className='text-xs'
										>
											3mm
										</Badge>
									</CardContent>
								</Card>

								<Card className='absolute bottom-20 right-12 w-56 rotate-3 shadow-xl hover:rotate-1 transition-transform border-secondary/20'>
									<CardHeader className='pb-3'>
										<div className='flex items-center justify-between'>
											<CardTitle className='text-sm'>
												Tu Pedido
											</CardTitle>
											<Badge variant='secondary'>
												Listo
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className='text-3xl font-bold text-secondary'>
											$24,500
										</div>
										<p className='text-xs text-muted-foreground mt-1'>
											ARS - 5 días
										</p>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id='como-funciona' className='py-20 md:py-28 bg-muted/30'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-3xl mx-auto mb-16'>
						<Badge variant='outline' className='mb-4'>
							Proceso simple
						</Badge>
						<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-4'>
							De diseño a pieza real en 4 pasos
						</h2>
						<p className='text-lg text-muted-foreground'>
							No necesitas conocimientos técnicos. Nuestro sistema
							te guía en cada paso.
						</p>
					</div>

					<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6'>
						{/* Step 1 */}
						<div className='relative'>
							<div className='flex flex-col items-start space-y-4'>
								<div className='relative'>
									<div className='size-14 rounded-xl bg-secondary/10 flex items-center justify-center border-2 border-secondary/20'>
										<Upload className='size-7 text-secondary' />
									</div>
									<div className='absolute -top-2 -right-2 size-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shadow-lg'>
										1
									</div>
								</div>

								<div className='space-y-2'>
									<h3 className='text-xl font-semibold'>
										Sube tu DXF
									</h3>
									<p className='text-muted-foreground text-sm leading-relaxed'>
										Arrastra tu archivo de diseño. Validamos
										formato y dimensiones automáticamente.
									</p>
								</div>
							</div>
						</div>

						{/* Step 2 */}
						<div className='relative lg:mt-8'>
							<div className='flex flex-col items-start space-y-4'>
								<div className='relative'>
									<div className='size-14 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20'>
										<Layers className='size-7 text-primary' />
									</div>
									<div className='absolute -top-2 -right-2 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg'>
										2
									</div>
								</div>

								<div className='space-y-2'>
									<h3 className='text-xl font-semibold'>
										Elige material
									</h3>
									<p className='text-muted-foreground text-sm leading-relaxed'>
										Selecciona entre acero inoxidable,
										aluminio, acero al carbono, cobre o
										latón.
									</p>
								</div>
							</div>
						</div>

						{/* Step 3 */}
						<div className='relative'>
							<div className='flex flex-col items-start space-y-4'>
								<div className='relative'>
									<div className='size-14 rounded-xl bg-secondary/10 flex items-center justify-center border-2 border-secondary/20'>
										<Sparkles className='size-7 text-secondary' />
									</div>
									<div className='absolute -top-2 -right-2 size-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shadow-lg'>
										3
									</div>
								</div>

								<div className='space-y-2'>
									<h3 className='text-xl font-semibold'>
										Pagá y listo
									</h3>
									<p className='text-muted-foreground text-sm leading-relaxed'>
										Precio final y transparente.
										Agrega grabado, pintura o ensamblaje si
										quieres.
									</p>
								</div>
							</div>
						</div>

						{/* Step 4 */}
						<div className='relative lg:mt-8'>
							<div className='flex flex-col items-start space-y-4'>
								<div className='relative'>
									<div className='size-14 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20'>
										<Package className='size-7 text-primary' />
									</div>
									<div className='absolute -top-2 -right-2 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg'>
										4
									</div>
								</div>

								<div className='space-y-2'>
									<h3 className='text-xl font-semibold'>
										Recibe tu pieza
									</h3>
									<p className='text-muted-foreground text-sm leading-relaxed'>
										Cortamos con precisión láser. Envío a
										todo el país en 5-7 días hábiles.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Materials Showcase */}
			<section className='py-20 md:py-28'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center max-w-3xl mx-auto mb-16'>
						<Badge variant='outline' className='mb-4'>
							Materiales premium
						</Badge>
						<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-4'>
							5 materiales de calidad industrial
						</h2>
						<p className='text-lg text-muted-foreground'>
							Cortamos con precisión de ±0.1mm en los mejores
							materiales del mercado
						</p>
					</div>

					<div className='grid sm:grid-cols-2 lg:grid-cols-5 gap-6'>
						{/* Stainless Steel */}
						<Card className='hover:shadow-lg transition-shadow hover:border-primary/50 group'>
							<CardHeader>
								<div className='size-16 rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 mb-4 shadow-inner' />
								<CardTitle className='text-base'>
									Acero Inoxidable
								</CardTitle>
								<CardDescription className='text-xs'>
									Resistente a corrosión, ideal para exterior
								</CardDescription>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex flex-wrap gap-1.5'>
									<Badge
										variant='outline'
										className='text-xs'
									>
										304
									</Badge>
									<Badge
										variant='outline'
										className='text-xs'
									>
										316
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Aluminum */}
						<Card className='hover:shadow-lg transition-shadow hover:border-primary/50 group sm:mt-6'>
							<CardHeader>
								<div className='size-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-400 mb-4 shadow-inner' />
								<CardTitle className='text-base'>
									Aluminio
								</CardTitle>
								<CardDescription className='text-xs'>
									Ligero y versátil, fácil de trabajar
								</CardDescription>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex flex-wrap gap-1.5'>
									<Badge
										variant='outline'
										className='text-xs'
									>
										6061
									</Badge>
									<Badge
										variant='outline'
										className='text-xs'
									>
										5052
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Carbon Steel */}
						<Card className='hover:shadow-lg transition-shadow hover:border-primary/50 group'>
							<CardHeader>
								<div className='size-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 mb-4 shadow-inner' />
								<CardTitle className='text-base'>
									Acero al Carbono
								</CardTitle>
								<CardDescription className='text-xs'>
									Económico y resistente, alta dureza
								</CardDescription>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex flex-wrap gap-1.5'>
									<Badge
										variant='outline'
										className='text-xs'
									>
										A36
									</Badge>
									<Badge
										variant='outline'
										className='text-xs'
									>
										1018
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Copper */}
						<Card className='hover:shadow-lg transition-shadow hover:border-primary/50 group sm:mt-6'>
							<CardHeader>
								<div className='size-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 mb-4 shadow-inner' />
								<CardTitle className='text-base'>
									Cobre
								</CardTitle>
								<CardDescription className='text-xs'>
									Conductividad excepcional, estética
								</CardDescription>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex flex-wrap gap-1.5'>
									<Badge
										variant='outline'
										className='text-xs'
									>
										C110
									</Badge>
									<Badge
										variant='outline'
										className='text-xs'
									>
										C101
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Brass */}
						<Card className='hover:shadow-lg transition-shadow hover:border-primary/50 group'>
							<CardHeader>
								<div className='size-16 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 mb-4 shadow-inner' />
								<CardTitle className='text-base'>
									Latón
								</CardTitle>
								<CardDescription className='text-xs'>
									Decorativo y maquinable, acabado dorado
								</CardDescription>
							</CardHeader>
							<CardContent className='pt-0'>
								<div className='flex flex-wrap gap-1.5'>
									<Badge
										variant='outline'
										className='text-xs'
									>
										260
									</Badge>
									<Badge
										variant='outline'
										className='text-xs'
									>
										360
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className='py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='grid lg:grid-cols-2 gap-12 items-center'>
						{/* Left - Benefits Grid */}
						<div className='space-y-8'>
							<div className='space-y-4'>
								<h2 className='text-3xl md:text-4xl font-bold tracking-tight'>
									Diseñado para{' '}
									<span className='text-secondary'>
										makers
									</span>{' '}
									como vos
								</h2>
								<p className='text-lg text-muted-foreground'>
									Sin mínimos de orden. Sin tiempos de espera
									eternos. Solo tu diseño convertido en
									realidad.
								</p>
							</div>

							<div className='grid gap-6'>
								<div className='flex gap-4'>
									<div className='size-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0'>
										<Zap className='size-6 text-secondary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											Cotización instantánea
										</h3>
										<p className='text-sm text-muted-foreground'>
											Precio en segundos, sin esperar
											respuestas de ventas. Transparencia
											total desde el inicio.
										</p>
									</div>
								</div>

								<div className='flex gap-4'>
									<div className='size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
										<Clock className='size-6 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											Rapidez garantizada
										</h3>
										<p className='text-sm text-muted-foreground'>
											5-7 días de producción + envío.
											Entrega express disponible para
											proyectos urgentes.
										</p>
									</div>
								</div>

								<div className='flex gap-4'>
									<div className='size-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0'>
										<ShieldCheck className='size-6 text-secondary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											Calidad profesional
										</h3>
										<p className='text-sm text-muted-foreground'>
											Máquinas industriales, precisión
											±0.1mm, control de calidad en cada
											pieza.
										</p>
									</div>
								</div>

								<div className='flex gap-4'>
									<div className='size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
										<Truck className='size-6 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											Envío a todo el país
										</h3>
										<p className='text-sm text-muted-foreground'>
											Embalaje seguro, tracking incluido.
											Recibí tu pieza donde estés.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right - Featured Card */}
						<div className='relative'>
							<div className='absolute inset-0 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-3xl blur-3xl' />
							<Card className='relative border-2 shadow-2xl'>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<Badge variant='secondary'>
											Popular
										</Badge>
										<Sparkles className='size-5 text-secondary' />
									</div>
									<CardTitle className='text-2xl pt-4'>
										Servicios adicionales
									</CardTitle>
									<CardDescription>
										Potenciá tu proyecto con nuestros extras
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<div className='space-y-4'>
										<div className='flex items-start gap-3'>
											<CheckCircle2 className='size-5 text-secondary mt-0.5 shrink-0' />
											<div>
												<div className='font-medium'>
													Grabado láser
												</div>
												<div className='text-sm text-muted-foreground'>
													Logos, texto, números de
													serie
												</div>
											</div>
										</div>

										<div className='flex items-start gap-3'>
											<CheckCircle2 className='size-5 text-secondary mt-0.5 shrink-0' />
											<div>
												<div className='font-medium'>
													Pintura y acabado
												</div>
												<div className='text-sm text-muted-foreground'>
													Anodizado, powder coating,
													barniz
												</div>
											</div>
										</div>

										<div className='flex items-start gap-3'>
											<CheckCircle2 className='size-5 text-secondary mt-0.5 shrink-0' />
											<div>
												<div className='font-medium'>
													Ensamblaje
												</div>
												<div className='text-sm text-muted-foreground'>
													Plegado, soldadura, montaje
													de piezas
												</div>
											</div>
										</div>

										<div className='flex items-start gap-3'>
											<CheckCircle2 className='size-5 text-secondary mt-0.5 shrink-0' />
											<div>
												<div className='font-medium'>
													Entrega express
												</div>
												<div className='text-sm text-muted-foreground'>
													2-3 días para proyectos
													urgentes
												</div>
											</div>
										</div>
									</div>

									<div className='pt-4'>
										<Button
											asChild
											className='w-full'
											size='lg'
										>
											<Link href='/quoting'>
												Comenzar ahora
												<ArrowRight />
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className='py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden'>
				<div className='absolute inset-0 bg-[linear-gradient(to_right,#fff1_1px,transparent_1px),linear-gradient(to_bottom,#fff1_1px,transparent_1px)] bg-[size:4rem_4rem]' />

				<div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8'>
					<div className='space-y-4'>
						<h2 className='text-3xl md:text-5xl font-bold tracking-tight'>
							Convertí tu diseño en realidad
						</h2>
						<p className='text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto'>
							Sube tu archivo DXF ahora y recibí tu cotización en
							segundos. Sin compromiso, sin complicaciones.
						</p>
					</div>

					<div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
						<Button
							asChild
							size='lg'
							variant='secondary'
							className='text-base shadow-xl hover:shadow-2xl transition-shadow'
						>
							<Link href='/quoting'>
								Cotizar mi proyecto
								<ArrowRight />
							</Link>
						</Button>

						<Button
							asChild
							size='lg'
							variant='outline'
							className='text-base bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20 text-primary-foreground'
						>
							<Link href='#como-funciona'>Ver cómo funciona</Link>
						</Button>
					</div>

					<div className='flex flex-wrap justify-center gap-8 pt-8 text-sm text-primary-foreground/80'>
						<div className='flex items-center gap-2'>
							<CheckCircle2 className='size-5' />
							<span>Sin mínimos de orden</span>
						</div>
						<div className='flex items-center gap-2'>
							<CheckCircle2 className='size-5' />
							<span>Pago seguro</span>
						</div>
						<div className='flex items-center gap-2'>
							<CheckCircle2 className='size-5' />
							<span>Garantía de calidad</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
