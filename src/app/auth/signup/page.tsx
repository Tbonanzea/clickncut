import SignUpForm from '@/components/forms/SignUpForm';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Crear Cuenta',
	description:
		'Crea tu cuenta gratuita en ClicknCut. Cotiza al instante tus proyectos de corte láser sin mínimos de pedido.',
	robots: {
		index: true,
		follow: true,
	},
};

export default function SignUpPage() {
	return (
		<div className='min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-muted/50 to-background'>
			<div className='w-full max-w-md space-y-6'>
				{/* Card */}
				<Card className='border-2 shadow-xl'>
					<CardHeader className='text-center pb-2'>
						{/* Logo */}
						<div className='text-center'>
							<Link href='/' className='inline-block'>
								<Image
									src='/images/logo.png'
									alt='ClicknCut'
									width={180}
									height={45}
									className='h-24 w-auto mx-auto'
								/>
							</Link>
						</div>
						<CardTitle className='text-2xl'>Crear Cuenta</CardTitle>
						<CardDescription>
							Únete a ClicknCut y convierte tus diseños en realidad
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Benefits */}
						<div className='flex flex-wrap justify-center gap-2'>
							<Badge variant='outline' className='text-xs'>
								<CheckCircle2 className='size-3 mr-1' />
								Cotización instantánea
							</Badge>
							<Badge variant='outline' className='text-xs'>
								<CheckCircle2 className='size-3 mr-1' />
								Sin mínimos
							</Badge>
							<Badge variant='outline' className='text-xs'>
								<CheckCircle2 className='size-3 mr-1' />
								Gratis
							</Badge>
						</div>

						<SignUpForm />
					</CardContent>
				</Card>

				{/* Footer text */}
				<p className='text-center text-sm text-muted-foreground'>
					¿Ya tenés cuenta?{' '}
					<Link
						href='/auth/login'
						className='text-secondary hover:text-secondary/80 font-medium'
					>
						Iniciá sesión
					</Link>
				</p>
			</div>
		</div>
	);
}
