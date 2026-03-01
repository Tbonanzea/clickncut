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

export async function signup(formData: SignUpData) {
	const { user } = await getUserByEmail(formData.email);
	if (user) {
		const isLocalAuthProvider = user.authProviders.includes(
			AuthProvider.EMAIL
		);

		throw new Error(
			`Ya existe un usuario con ese email${
				!isLocalAuthProvider
					? ` pero se ha registrado con alguno de estos metodos: ${user.authProviders.toString()}`
					: ''
			}`
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
		throw new Error(error.message);
	}

	if (!data?.user) {
		throw new Error('No se ha podido registrar el usuario');
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
		throw new Error(error.message);
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
		// Check is user is social login in prisma
		let appendMessage = '';
		const user = await prisma.user.findUnique({
			where: {
				email: formData.email,
			},
		});

		if (!user) {
			throw new Error('Usuario no existe.');
		}

		// Append message if user is not local
		if (!user?.authProviders.includes(AuthProvider.EMAIL)) {
			appendMessage = `Tu usuario fue creado con ${user?.authProviders.filter(
				(provider) => provider !== AuthProvider.EMAIL
			)}, por favor inicia sesion con alguno de estos metodos.`;
		}

		throw new Error(`Inicio de sesion invalido. ${appendMessage}`);
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
