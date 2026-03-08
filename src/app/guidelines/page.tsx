import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ScrollableNav } from './scrollable-nav';
import {
	FileText,
	Ruler,
	Layers,
	Target,
	Maximize2,
	Lightbulb,
	AlertTriangle,
	CheckCircle2,
	ArrowRight,
	Info,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Guía de Diseño para Corte Láser - ClicknCut',
	description:
		'Guía completa para preparar tus archivos DXF para corte láser. Aprende sobre tolerancias, materiales, y mejores prácticas para obtener resultados perfectos.',
};

const sections = [
	{ id: 'preparacion', label: 'Preparación de archivos', icon: FileText },
	{ id: 'pautas', label: 'Pautas de corte', icon: Ruler },
	{ id: 'materiales', label: 'Materiales y espesores', icon: Layers },
	{ id: 'tolerancias', label: 'Tolerancias y precisión', icon: Target },
	{ id: 'tamanos', label: 'Tamaños de pieza', icon: Maximize2 },
	{ id: 'consejos', label: 'Consejos de diseño', icon: Lightbulb },
];

export default function GuidelinesPage() {
	return (
		<div className='flex flex-col'>
			{/* Hero Section */}
			<section className='py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
					<Badge variant='secondary' className='mb-4'>
						<FileText className='size-3' />
						Guía técnica
					</Badge>
					<h1 className='text-4xl md:text-5xl font-bold tracking-tight mb-6'>
						Guía de Diseño para{' '}
						<span className='text-secondary'>Corte Láser</span>
					</h1>
					<p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
						Todo lo que necesitás saber para preparar tus archivos y obtener
						resultados perfectos en cada corte.
					</p>
				</div>
			</section>

			{/* Main Content with Sidebar */}
			<section className='py-12 md:py-16'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col lg:flex-row gap-8 lg:gap-12'>
						{/* Sidebar Navigation - Desktop */}
						<aside className='hidden lg:block w-64 shrink-0'>
							<nav className='sticky top-24 space-y-1'>
								<div className='text-sm font-semibold text-foreground mb-3'>
									En esta guía
								</div>
								{sections.map((section) => {
									const Icon = section.icon;
									return (
										<a
											key={section.id}
											href={`#${section.id}`}
											className='flex items-center gap-2 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors'
										>
											<Icon className='size-4' />
											{section.label}
										</a>
									);
								})}
							</nav>
						</aside>

						{/* Mobile Navigation - Horizontal Scroll */}
						<ScrollableNav
							sections={sections.map(({ id, label }) => ({ id, label }))}
						/>

						{/* Content */}
						<div className='flex-1 space-y-12'>
							{/* Section 1: Preparación de archivos */}
							<div id='preparacion' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-secondary/10 flex items-center justify-center'>
										<FileText className='size-5 text-secondary' />
									</div>
									<h2 className='text-3xl font-bold'>Preparación de archivos</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6 space-y-4'>
											<div>
												<h3 className='text-lg font-semibold mb-2'>
													Formatos aceptados
												</h3>
												<p className='text-muted-foreground mb-3'>
													Actualmente trabajamos exclusivamente con archivos DXF
													para garantizar la máxima precisión en el proceso de
													corte.
												</p>
												<div className='flex items-start gap-2 p-3 bg-muted/50 rounded-lg'>
													<CheckCircle2 className='size-5 text-secondary shrink-0 mt-0.5' />
													<div>
														<p className='font-medium text-sm'>
															DXF (Drawing Exchange Format)
														</p>
														<p className='text-sm text-muted-foreground'>
															Versiones R12 y superiores. Compatible con
															AutoCAD, SolidWorks, Fusion 360, Inkscape, y más.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Preparación del archivo
												</h3>
												<div className='space-y-2'>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p className='text-sm'>
															<strong>Líneas cerradas:</strong> Asegurate que
															todos los contornos estén completamente cerrados
															(sin gaps)
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p className='text-sm'>
															<strong>Unidades:</strong> Especificá las unidades
															correctas (mm recomendado)
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p className='text-sm'>
															<strong>Capas (layers):</strong> Organizá las líneas
															de corte en capas separadas si tenés diferentes
															operaciones
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p className='text-sm'>
															<strong>Texto y bloques:</strong> Convertí todos los
															textos y bloques a líneas/curvas antes de exportar
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p className='text-sm'>
															<strong>Simplificación:</strong> Eliminá elementos
															innecesarios (dimensiones, anotaciones, ejes)
														</p>
													</div>
												</div>
											</div>

											<div className='flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-lg'>
												<Info className='size-5 text-info shrink-0 mt-0.5' />
												<div className='text-sm'>
													<p className='font-medium text-info mb-1'>
														Consejo profesional
													</p>
													<p className='text-muted-foreground'>
														Antes de subir tu archivo, hacé un zoom para verificar
														que no haya líneas duplicadas o segmentos
														superpuestos. Esto puede causar problemas en el corte.
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Section 2: Pautas de corte láser */}
							<div id='pautas' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center'>
										<Ruler className='size-5 text-primary' />
									</div>
									<h2 className='text-3xl font-bold'>Pautas de corte láser</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6 space-y-4'>
											<div>
												<h3 className='text-lg font-semibold mb-2'>
													Kerf (ancho de corte)
												</h3>
												<p className='text-muted-foreground mb-3'>
													El láser consume material al cortar. Este &ldquo;kerf&rdquo; varía
													según el material y espesor.
												</p>
												<div className='overflow-x-auto'>
													<table className='w-full text-sm'>
														<thead>
															<tr className='border-b'>
																<th className='text-left py-2 font-semibold'>
																	Material
																</th>
																<th className='text-left py-2 font-semibold'>
																	Espesor
																</th>
																<th className='text-left py-2 font-semibold'>
																	Kerf aproximado
																</th>
															</tr>
														</thead>
														<tbody className='text-muted-foreground'>
															<tr className='border-b'>
																<td className='py-2'>Acero</td>
																<td className='py-2'>1-3mm</td>
																<td className='py-2'>0.2-0.3mm</td>
															</tr>
															<tr className='border-b'>
																<td className='py-2'>Acrílico</td>
																<td className='py-2'>3-10mm</td>
																<td className='py-2'>0.1-0.15mm</td>
															</tr>
															<tr className='border-b'>
																<td className='py-2'>MDF</td>
																<td className='py-2'>3-12mm</td>
																<td className='py-2'>0.15-0.25mm</td>
															</tr>
															<tr>
																<td className='py-2'>Aluminio</td>
																<td className='py-2'>1-2mm</td>
																<td className='py-2'>0.25-0.35mm</td>
															</tr>
														</tbody>
													</table>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Dimensiones mínimas
												</h3>
												<div className='grid sm:grid-cols-2 gap-3'>
													<div className='p-3 border rounded-lg'>
														<div className='text-2xl font-bold text-secondary mb-1'>
															0.5mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Ancho mínimo de línea
														</p>
													</div>
													<div className='p-3 border rounded-lg'>
														<div className='text-2xl font-bold text-secondary mb-1'>
															1mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Diámetro mínimo de agujero
														</p>
													</div>
													<div className='p-3 border rounded-lg'>
														<div className='text-2xl font-bold text-secondary mb-1'>
															2mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Separación mínima entre cortes
														</p>
													</div>
													<div className='p-3 border rounded-lg'>
														<div className='text-2xl font-bold text-secondary mb-1'>
															0.3mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Radio interno mínimo
														</p>
													</div>
												</div>
											</div>

											<div className='flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
												<AlertTriangle className='size-5 text-destructive shrink-0 mt-0.5' />
												<div className='text-sm'>
													<p className='font-medium text-destructive mb-1'>
														Importante
													</p>
													<p className='text-muted-foreground'>
														Features más pequeñas que las dimensiones mínimas
														pueden no cortarse correctamente o generar rebabas.
														Diseñá con márgenes de seguridad.
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Section 3: Materiales y espesores */}
							<div id='materiales' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-secondary/10 flex items-center justify-center'>
										<Layers className='size-5 text-secondary' />
									</div>
									<h2 className='text-3xl font-bold'>
										Materiales y espesores
									</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6'>
											<div className='space-y-6'>
												<div>
													<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
														<Badge variant='outline' className='text-xs'>
															Metal
														</Badge>
														Acero al carbono
													</h3>
													<div className='space-y-2 text-sm text-muted-foreground'>
														<p>
															<strong className='text-foreground'>
																Espesores disponibles:
															</strong>{' '}
															0.5mm, 0.8mm, 1mm, 1.5mm, 2mm, 3mm, 4mm, 5mm, 6mm
														</p>
														<p>
															<strong className='text-foreground'>
																Tolerancia:
															</strong>{' '}
															±0.1mm en piezas de hasta 500mm. ±0.2mm en piezas
															mayores.
														</p>
														<p>
															<strong className='text-foreground'>
																Aplicaciones:
															</strong>{' '}
															Soportes estructurales, carcasas, herrajes, piezas
															mecánicas.
														</p>
													</div>
												</div>

												<div className='border-t pt-6'>
													<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
														<Badge variant='outline' className='text-xs'>
															Metal
														</Badge>
														Acero inoxidable
													</h3>
													<div className='space-y-2 text-sm text-muted-foreground'>
														<p>
															<strong className='text-foreground'>
																Espesores disponibles:
															</strong>{' '}
															0.5mm, 0.8mm, 1mm, 1.5mm, 2mm, 3mm
														</p>
														<p>
															<strong className='text-foreground'>
																Tolerancia:
															</strong>{' '}
															±0.1mm (material premium, mayor precisión)
														</p>
														<p>
															<strong className='text-foreground'>
																Aplicaciones:
															</strong>{' '}
															Equipamiento médico, industria alimentaria,
															exteriores, elementos decorativos.
														</p>
													</div>
												</div>

												<div className='border-t pt-6'>
													<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
														<Badge variant='outline' className='text-xs'>
															Metal
														</Badge>
														Aluminio
													</h3>
													<div className='space-y-2 text-sm text-muted-foreground'>
														<p>
															<strong className='text-foreground'>
																Espesores disponibles:
															</strong>{' '}
															1mm, 1.5mm, 2mm, 3mm
														</p>
														<p>
															<strong className='text-foreground'>
																Tolerancia:
															</strong>{' '}
															±0.15mm (material reflectivo, mayor kerf)
														</p>
														<p>
															<strong className='text-foreground'>
																Aplicaciones:
															</strong>{' '}
															Paneles livianos, disipadores, carcasas
															electrónicas.
														</p>
													</div>
												</div>

												<div className='border-t pt-6'>
													<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
														<Badge variant='outline' className='text-xs'>
															Plástico
														</Badge>
														Acrílico (PMMA)
													</h3>
													<div className='space-y-2 text-sm text-muted-foreground'>
														<p>
															<strong className='text-foreground'>
																Espesores disponibles:
															</strong>{' '}
															3mm, 4mm, 5mm, 6mm, 8mm, 10mm
														</p>
														<p>
															<strong className='text-foreground'>
																Tolerancia:
															</strong>{' '}
															±0.1mm (corte muy limpio, bordes pulidos)
														</p>
														<p>
															<strong className='text-foreground'>
																Aplicaciones:
															</strong>{' '}
															Señalización, displays, prototipos, piezas
															transparentes, arte.
														</p>
													</div>
												</div>

												<div className='border-t pt-6'>
													<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
														<Badge variant='outline' className='text-xs'>
															Madera
														</Badge>
														MDF
													</h3>
													<div className='space-y-2 text-sm text-muted-foreground'>
														<p>
															<strong className='text-foreground'>
																Espesores disponibles:
															</strong>{' '}
															3mm, 5mm, 6mm, 9mm, 12mm, 15mm
														</p>
														<p>
															<strong className='text-foreground'>
																Tolerancia:
															</strong>{' '}
															±0.2mm (bordes quemados, requiere acabado)
														</p>
														<p>
															<strong className='text-foreground'>
																Aplicaciones:
															</strong>{' '}
															Maquetas, prototipos, packaging, moldes,
															mueblería.
														</p>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Section 4: Tolerancias y precisión */}
							<div id='tolerancias' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center'>
										<Target className='size-5 text-primary' />
									</div>
									<h2 className='text-3xl font-bold'>
										Tolerancias y precisión
									</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6 space-y-4'>
											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Tolerancias generales
												</h3>
												<div className='space-y-3'>
													<div className='p-4 bg-muted/50 rounded-lg'>
														<div className='flex items-baseline gap-2 mb-2'>
															<span className='text-3xl font-bold text-secondary'>
																±0.1mm
															</span>
															<span className='text-sm text-muted-foreground'>
																Precisión estándar
															</span>
														</div>
														<p className='text-sm text-muted-foreground'>
															Para la mayoría de piezas y aplicaciones generales.
															Válido para dimensiones de hasta 500mm.
														</p>
													</div>

													<div className='p-4 bg-muted/50 rounded-lg'>
														<div className='flex items-baseline gap-2 mb-2'>
															<span className='text-3xl font-bold text-primary'>
																±0.05mm
															</span>
															<span className='text-sm text-muted-foreground'>
																Alta precisión
															</span>
														</div>
														<p className='text-sm text-muted-foreground'>
															Disponible bajo pedido para piezas críticas.
															Requiere materiales premium y verificación
															dimensional completa.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Calidad de borde
												</h3>
												<div className='space-y-2 text-sm'>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>Metales:</strong> Borde limpio con mínima
															rebaba. Puede requerir desbarbado ligero.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>Acrílico:</strong> Borde transparente y
															pulido, ideal para visualización directa.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>MDF:</strong> Borde oscurecido por
															quemado. Requiere pintura o sellado para acabado
															final.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Perpendicularidad
												</h3>
												<p className='text-sm text-muted-foreground mb-2'>
													El corte láser produce bordes perpendiculares al plano
													de la pieza. Sin embargo, en materiales gruesos puede
													haber una ligera conicidad:
												</p>
												<div className='overflow-x-auto'>
													<table className='w-full text-sm'>
														<thead>
															<tr className='border-b'>
																<th className='text-left py-2 font-semibold'>
																	Espesor
																</th>
																<th className='text-left py-2 font-semibold'>
																	Ángulo típico
																</th>
																<th className='text-left py-2 font-semibold'>
																	Diferencia sup/inf
																</th>
															</tr>
														</thead>
														<tbody className='text-muted-foreground'>
															<tr className='border-b'>
																<td className='py-2'>0.5-2mm</td>
																<td className='py-2'>89.5-90°</td>
																<td className='py-2'>&lt;0.05mm</td>
															</tr>
															<tr className='border-b'>
																<td className='py-2'>3-5mm</td>
																<td className='py-2'>89-90°</td>
																<td className='py-2'>0.1-0.15mm</td>
															</tr>
															<tr>
																<td className='py-2'>6mm+</td>
																<td className='py-2'>88-90°</td>
																<td className='py-2'>0.2-0.3mm</td>
															</tr>
														</tbody>
													</table>
												</div>
											</div>

											<div className='flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-lg'>
												<Info className='size-5 text-info shrink-0 mt-0.5' />
												<div className='text-sm'>
													<p className='font-medium text-info mb-1'>
														Dimensiones críticas
													</p>
													<p className='text-muted-foreground'>
														Si tenés dimensiones críticas (ajustes, encastres
														precisos), incluí una nota en tu pedido. Podemos
														hacer verificación dimensional y ajustar parámetros
														de corte.
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Section 5: Tamaños de pieza */}
							<div id='tamanos' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-secondary/10 flex items-center justify-center'>
										<Maximize2 className='size-5 text-secondary' />
									</div>
									<h2 className='text-3xl font-bold'>Tamaños de pieza</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6 space-y-4'>
											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Dimensiones máximas
												</h3>
												<p className='text-muted-foreground mb-4'>
													Nuestras máquinas de corte láser tienen las siguientes
													capacidades:
												</p>
												<div className='grid sm:grid-cols-2 gap-4'>
													<div className='p-4 border rounded-lg'>
														<div className='text-sm font-medium text-muted-foreground mb-1'>
															Área de trabajo estándar
														</div>
														<div className='text-2xl font-bold text-secondary mb-2'>
															1500 × 3000mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Ideal para la mayoría de proyectos. Disponibilidad
															inmediata.
														</p>
													</div>

													<div className='p-4 border rounded-lg'>
														<div className='text-sm font-medium text-muted-foreground mb-1'>
															Área de trabajo grande
														</div>
														<div className='text-2xl font-bold text-secondary mb-2'>
															2000 × 4000mm
														</div>
														<p className='text-sm text-muted-foreground'>
															Para proyectos de mayor escala. Consultar
															disponibilidad.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Dimensiones mínimas
												</h3>
												<p className='text-sm text-muted-foreground mb-3'>
													No hay tamaño mínimo de pieza, pero considerá estos
													factores prácticos:
												</p>
												<div className='space-y-2 text-sm'>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															Piezas muy pequeñas (&lt;10mm) pueden ser difíciles
															de manipular y recuperar del material residual.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															El precio mínimo de corte es equivalente a una
															pieza de 50×50mm, sin importar el tamaño real.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<CheckCircle2 className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															Para producción de piezas muy pequeñas (&lt;20mm),
															recomendamos diseñar en panel con múltiples copias.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3'>
													Optimización de material
												</h3>
												<p className='text-sm text-muted-foreground mb-3'>
													Para optimizar costos, considerá estos consejos:
												</p>
												<div className='space-y-2 text-sm'>
													<div className='flex items-start gap-2'>
														<Lightbulb className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>Nesting automático:</strong> Nuestro
															sistema organiza múltiples piezas para minimizar
															desperdicio.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<Lightbulb className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>Medidas de chapa:</strong> Los materiales
															vienen en chapas estándar (1000×2000mm,
															1250×2500mm). Diseños que se ajusten a estos
															tamaños reducen costos.
														</p>
													</div>
													<div className='flex items-start gap-2'>
														<Lightbulb className='size-4 text-secondary shrink-0 mt-1' />
														<p>
															<strong>Múltiples copias:</strong> Si necesitás
															varias piezas idénticas, el costo por unidad se
															reduce significativamente.
														</p>
													</div>
												</div>
											</div>

											<div className='flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-lg'>
												<Info className='size-5 text-info shrink-0 mt-0.5' />
												<div className='text-sm'>
													<p className='font-medium text-info mb-1'>
														Consultas sobre tamaño
													</p>
													<p className='text-muted-foreground'>
														Si tu proyecto requiere dimensiones fuera de los
														rangos estándar, contactanos. Tenemos acceso a
														equipos de mayor capacidad para proyectos
														especiales.
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>

							{/* Section 6: Consejos de diseño */}
							<div id='consejos' className='scroll-mt-32 lg:scroll-mt-24'>
								<div className='flex items-center gap-2 mb-6'>
									<div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center'>
										<Lightbulb className='size-5 text-primary' />
									</div>
									<h2 className='text-3xl font-bold'>Consejos de diseño</h2>
								</div>

								<div className='space-y-6'>
									<Card>
										<CardContent className='pt-6 space-y-4'>
											<div>
												<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
													<CheckCircle2 className='size-5 text-secondary' />
													Mejores prácticas
												</h3>
												<div className='space-y-3'>
													<div className='p-3 border-l-4 border-secondary bg-muted/30'>
														<p className='font-medium mb-1'>
															Esquinas interiores
														</p>
														<p className='text-sm text-muted-foreground'>
															Todas las esquinas interiores tendrán un radio
															mínimo de 0.1-0.3mm (según el espesor). Si
															necesitás esquinas vivas, considerá diseñar con
															filetes o usar post-procesado.
														</p>
													</div>

													<div className='p-3 border-l-4 border-secondary bg-muted/30'>
														<p className='font-medium mb-1'>
															Agujeros y recortes
														</p>
														<p className='text-sm text-muted-foreground'>
															Para agujeros pequeños (&lt;3mm), el diámetro real
															puede variar hasta ±0.15mm. Usá plantilla de prueba
															para ajustes críticos.
														</p>
													</div>

													<div className='p-3 border-l-4 border-secondary bg-muted/30'>
														<p className='font-medium mb-1'>
															Grabado y marcado
														</p>
														<p className='text-sm text-muted-foreground'>
															Aunque nuestra especialidad es corte, podemos hacer
															marcado superficial en algunos materiales.
															Consultá disponibilidad.
														</p>
													</div>

													<div className='p-3 border-l-4 border-secondary bg-muted/30'>
														<p className='font-medium mb-1'>Encastres</p>
														<p className='text-sm text-muted-foreground'>
															Para diseños con encastres (slots, tabs), agregá
															0.2-0.3mm de holgura para compensar tolerancias y
															facilitar el ensamblado.
														</p>
													</div>
												</div>
											</div>

											<div>
												<h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
													<AlertTriangle className='size-5 text-destructive' />
													Errores comunes a evitar
												</h3>
												<div className='space-y-3'>
													<div className='p-3 border-l-4 border-destructive bg-destructive/5'>
														<p className='font-medium mb-1'>
															Líneas abiertas o no cerradas
														</p>
														<p className='text-sm text-muted-foreground'>
															El láser no puede cortar contornos incompletos. Verificá
															que todos los paths estén cerrados.
														</p>
													</div>

													<div className='p-3 border-l-4 border-destructive bg-destructive/5'>
														<p className='font-medium mb-1'>
															Features demasiado finas
														</p>
														<p className='text-sm text-muted-foreground'>
															Elementos más delgados que 0.5mm probablemente se
															quemen o deformen durante el corte.
														</p>
													</div>

													<div className='p-3 border-l-4 border-destructive bg-destructive/5'>
														<p className='font-medium mb-1'>
															Separaciones insuficientes
														</p>
														<p className='text-sm text-muted-foreground'>
															Dejá al menos 2mm entre cortes. Separaciones más
															pequeñas pueden causar deformación por calor.
														</p>
													</div>

													<div className='p-3 border-l-4 border-destructive bg-destructive/5'>
														<p className='font-medium mb-1'>
															Textos sin convertir
														</p>
														<p className='text-sm text-muted-foreground'>
															Los textos deben convertirse a curvas/paths.
															Archivos con fuentes pueden no procesarse
															correctamente.
														</p>
													</div>
												</div>
											</div>

											<div className='p-4 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg border border-secondary/20'>
												<div className='flex items-start gap-3'>
													<Lightbulb className='size-6 text-secondary shrink-0 mt-0.5' />
													<div>
														<h4 className='font-semibold mb-2'>
															Prototipos primero
														</h4>
														<p className='text-sm text-muted-foreground mb-3'>
															Si es tu primer proyecto con corte láser o estás
															probando un diseño complejo, recomendamos fuertemente
															hacer un prototipo en material económico (MDF o
															acrílico fino) antes de cortar en el material final.
														</p>
														<p className='text-sm text-muted-foreground'>
															Esto te permite verificar dimensiones, encastres, y
															funcionalidad con una inversión mínima.
														</p>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-16 md:py-20 bg-primary text-primary-foreground'>
				<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8'>
					<h2 className='text-3xl md:text-4xl font-bold tracking-tight'>
						¿Listo para hacer tu pedido?
					</h2>
					<p className='text-lg text-primary-foreground/90 max-w-2xl mx-auto'>
						Ahora que conocés las pautas de diseño, subí tu archivo DXF y
						obtené tu cotización instantánea. Es gratis y sin compromiso.
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
