'use client';

import { useLogInMutation } from '@/hooks/auth/useLoginMutation';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { signInWithGoogle } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
	email: z.string().email('Ingresa un email válido'),
	password: z
		.string()
		.min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LogInForm() {
	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const {
		mutate: logIn,
		isPending,
		isError,
		error,
	} = useLogInMutation();

	const onSubmit = (formData: LoginFormData) => {
		logIn(formData);
	};

	const onGoogleClick = () => {
		signInWithGoogle();
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-4 max-w-sm'
			>
				<FormField
					control={form.control}
					name='email'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									placeholder='tuemail@ejemplo.com'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='password'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contraseña</FormLabel>
							<FormControl>
								<Input
									type='password'
									placeholder='••••••••'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type='submit' disabled={isPending} className='w-full'>
					{isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
				</Button>
				<Button
					type='button'
					variant='outline'
					onClick={onGoogleClick}
					className='w-full'
				>
					Google
				</Button>

				<div className='text-sm mt-2'>
					<Link href='/auth/signup' className='underline'>
						¿No tienes cuenta? Regístrate
					</Link>
				</div>

				<div className='text-sm mt-1'>
					<Link href='/auth/password/forgot' className='underline'>
						¿Olvidaste tu contraseña?
					</Link>
				</div>

				{isError && (
					<p className='text-red-500 mt-2'>
						{(error as Error).message}
					</p>
				)}
				</form>
		</Form>
	);
}
