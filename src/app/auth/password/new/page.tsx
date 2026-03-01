import NewPasswordForm from '@/components/forms/NewPasswordForm';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Nueva Contraseña',
	description: 'Establece una nueva contraseña para tu cuenta de ClicknCut.',
	robots: {
		index: false,
		follow: false,
	},
};

interface NewPasswordPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewPasswordPage({
	searchParams,
}: NewPasswordPageProps) {
	const params = await searchParams;
	const { emailRedirectTo } = params;

	if (!emailRedirectTo) {
		const error = new Error('No se ha especificado una URL para redirigir');
		redirect(`/error?error=${error.message}`);
	}

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
						<CardTitle className='text-2xl'>
							Nueva Contraseña
						</CardTitle>
						<CardDescription>
							Elegí una contraseña segura para proteger tu cuenta
						</CardDescription>
					</CardHeader>
					<CardContent>
						<NewPasswordForm
							emailRedirectTo={emailRedirectTo as string}
						/>
					</CardContent>
				</Card>

				{/* Footer text */}
				<p className='text-center text-sm text-muted-foreground'>
					¿Recordaste tu contraseña?{' '}
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
