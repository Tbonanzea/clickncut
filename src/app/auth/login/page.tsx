import LogInForm from '@/components/forms/LogInForm';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Logo from '@/components/Logo';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Iniciar Sesión',
	description:
		'Accede a tu cuenta de ClicknCut para cotizar y gestionar tus pedidos de corte láser.',
	robots: {
		index: true,
		follow: true,
	},
};

export default function LogInPage() {
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
							Iniciar Sesión
						</CardTitle>
						<CardDescription>
							Accede a tu cuenta para cotizar y gestionar tus
							pedidos
						</CardDescription>
					</CardHeader>
					<CardContent>
						<LogInForm />
					</CardContent>
				</Card>

				{/* Footer text */}
				<p className='text-center text-sm text-muted-foreground'>
					¿Primera vez en ClicknCut?{' '}
					<Link
						href='/auth/signup'
						className='text-secondary hover:text-secondary/80 font-medium'
					>
						Crea tu cuenta gratis
					</Link>
				</p>
			</div>
		</div>
	);
}
