'use server';

import { createUser, getUserByEmail } from '@/app/(dashboard)/users/actions';
import { SignUpData } from '@/hooks/auth/useSignUpMutation';
import { NewPasswordData } from '@/hooks/auth/useNewPasswordMutation';
import { LogInData } from '@/hooks/auth/useLoginMutation';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { AuthProvider } from '@/generated/prisma/client';
import { Provider } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseErrorMessages: Record<string, string> = {
	'Invalid login credentials': 'Email o contraseña incorrectos.',
	'Email not confirmed': 'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
	'User already registered': 'Ya existe una cuenta con este email.',
	'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
	'Email rate limit exceeded': 'Demasiados intentos. Intenta de nuevo en unos minutos.',
	'For security purposes, you can only request this after': 'Por seguridad, debes esperar antes de intentar de nuevo.',
	'New password should be different from the old password.': 'La nueva contraseña debe ser diferente a la anterior.',
	'Auth session missing!': 'Tu sesion ha expirado. Inicia sesion de nuevo.',
};

function translateSupabaseError(message: string): string {
	for (const [key, value] of Object.entries(supabaseErrorMessages)) {
		if (message.includes(key)) return value;
	}
	return message;
}

export async function signup(formData: SignUpData) {
	const { user } = await getUserByEmail(formData.email);
	if (user) {
		const isLocalAuthProvider = user.authProviders.includes(
			AuthProvider.EMAIL
		);

		if (isLocalAuthProvider) {
			throw new Error('Ya existe una cuenta con este email.');
		}

		const providers = user.authProviders
			.filter((p) => p !== AuthProvider.EMAIL)
			.join(', ');
		throw new Error(
			`Ya existe una cuenta con este email registrada con ${providers}. Inicia sesion con ese metodo.`
		);
	}

	const supabase = await createClient();
	const { data, error } = await supabase.auth.signUp({
		...formData,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
		},
	});

	if (error) {
		throw new Error(translateSupabaseError(error.message));
	}

	if (!data?.user) {
		throw new Error('No se pudo crear la cuenta. Intenta de nuevo.');
	}

	const newUserResponse = await createUser({
		id: data?.user?.id,
		email: formData.email,
		authProviders: [AuthProvider.EMAIL],
	});

	return newUserResponse;
}

const signInWithProvider = async (provider: Provider) => {
	const supabase = await createClient();
	const nextUrl = encodeURIComponent(`/quoting`);

	const authCallbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${nextUrl}`;
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: authCallbackUrl,
		},
	});

	if (error) {
		throw new Error(error.message);
	}

	if (data.url) {
		redirect(data.url);
	}
};

export const signInWithGoogle = async () => signInWithProvider('google');

export const signOut = async () => {
	const supabase = await createClient();
	await supabase.auth.signOut();
};

export async function newPassword({
	newPassword,
	emailRedirectTo,
}: NewPasswordData) {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.updateUser({
		password: newPassword,
	});

	if (error) {
		throw new Error(translateSupabaseError(error.message));
	}

	if (data.user && emailRedirectTo) {
		redirect(emailRedirectTo);
	}

	return data;
}

export async function login(formData: LogInData) {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.signInWithPassword(formData);

	if (error) {
		const user = await prisma.user.findUnique({
			where: { email: formData.email },
		});

		if (!user) {
			throw new Error('No existe una cuenta con este email.');
		}

		if (!user.authProviders.includes(AuthProvider.EMAIL)) {
			const providers = user.authProviders
				.filter((p) => p !== AuthProvider.EMAIL)
				.join(', ');
			throw new Error(
				`Esta cuenta fue creada con ${providers}. Inicia sesion con ese metodo.`
			);
		}

		throw new Error(translateSupabaseError(error.message));
	}

	return data;
}

export async function requestResetPassword(email: string) {
	const supabase = await createClient();

	const { data } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/quoting`,
	});

	return data;
}
