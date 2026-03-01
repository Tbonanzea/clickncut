import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
	return (
		<footer className='w-full bg-primary text-primary-foreground mt-auto'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8'>
					{/* Brand Column */}
					<div className='lg:col-span-1'>
						<Link href='/' className='inline-block mb-4'>
							<Image
								src='/images/logo.png'
								alt='ClicknCut'
								width={140}
								height={35}
								className='brightness-0 invert'
							/>
						</Link>
						<p className='text-sm text-primary-foreground/80 leading-relaxed'>
							Plataforma de corte láser para makers. Tu diseño convertido
							en realidad con precisión industrial.
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className='font-semibold mb-4 text-sm uppercase tracking-wider'>
							Enlaces rápidos
						</h3>
						<ul className='space-y-3'>
							<li>
								<Link
									href='/quoting'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									Cotizador
								</Link>
							</li>
							<li>
								<Link
									href='/about'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									Acerca de nosotros
								</Link>
							</li>
							<li>
								<Link
									href='/orders'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									Mis pedidos
								</Link>
							</li>
							<li>
								<Link
									href='/profile'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									Mi cuenta
								</Link>
							</li>
						</ul>
					</div>

					{/* Services */}
					<div>
						<h3 className='font-semibold mb-4 text-sm uppercase tracking-wider'>
							Servicios
						</h3>
						<ul className='space-y-3'>
							<li>
								<span className='text-sm text-primary-foreground/80'>
									Corte láser
								</span>
							</li>
							<li>
								<span className='text-sm text-primary-foreground/80'>
									Corte a medida
								</span>
							</li>
							<li>
								<span className='text-sm text-primary-foreground/80'>
									Grabado láser
								</span>
							</li>
							<li>
								<span className='text-sm text-primary-foreground/80'>
									Pintura y acabados
								</span>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h3 className='font-semibold mb-4 text-sm uppercase tracking-wider'>
							Contacto
						</h3>
						<ul className='space-y-3'>
							<li className='flex items-start gap-3'>
								<Mail className='size-4 mt-0.5 shrink-0 text-primary-foreground/60' />
								<a
									href='mailto:info@clickncut.com'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									info@clickncut.com
								</a>
							</li>
							<li className='flex items-start gap-3'>
								<Phone className='size-4 mt-0.5 shrink-0 text-primary-foreground/60' />
								<a
									href='tel:+5491123456789'
									className='text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors'
								>
									+54 9 351 123-456789
								</a>
							</li>
							<li className='flex items-start gap-3'>
								<MapPin className='size-4 mt-0.5 shrink-0 text-primary-foreground/60' />
								<span className='text-sm text-primary-foreground/80'>
									Cordoba, Argentina
								</span>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className='mt-12 pt-8 border-t border-primary-foreground/10'>
					<div className='flex flex-col md:flex-row justify-between items-center gap-4'>
						<p className='text-sm text-primary-foreground/60'>
							© {new Date().getFullYear()} ClicknCut. Todos los derechos
							reservados.
						</p>
						<div className='flex items-center gap-6'>
							<Link
								href='/terms'
								className='text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors'
							>
								Términos y condiciones
							</Link>
							<Link
								href='/privacy'
								className='text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors'
							>
								Política de privacidad
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
