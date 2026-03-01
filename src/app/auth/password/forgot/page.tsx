import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Recuperar Contraseña',
	description:
		'Recupera el acceso a tu cuenta de ClicknCut. Te enviaremos un enlace para restablecer tu contraseña.',
	robots: {
		index: false,
		follow: false,
	},
};

export default function ForgotPasswordPage() {
	return (
		<div className='min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-muted/50 to-background'>
			<div className='w-full max-w-md space-y-6'>
				{/* Card */}
				<Card className='border-2 shadow-xl'>
					<CardHeader className='text-center pb-2'>
						{/* Logo */}
						<div className='flex justify-center'>
							<Logo iconSize={36} className='text-[#d05f43]' textClass='text-xl text-[#28465a]' />
						</div>
						<CardTitle className='text-2xl'>
							Recuperar Contraseña
						</CardTitle>
						<CardDescription>
							Ingresá tu email y te enviaremos un enlace para
							restablecer tu contraseña
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ForgotPasswordForm />
					</CardContent>
				</Card>

				{/* Back to login */}
				<div className='text-center'>
					<Link
						href='/auth/login'
						className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
					>
						<ArrowLeft className='size-4' />
						Volver a iniciar sesión
					</Link>
				</div>
			</div>
		</div>
	);
}
