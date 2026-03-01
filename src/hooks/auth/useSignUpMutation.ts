'use client';

import { signup, AuthResponse } from '@/app/auth/actions';
import { useMutation } from '@tanstack/react-query';

export type SignUpData = {
	email: string;
	password: string;
};

async function signUpApiCall(data: SignUpData): Promise<AuthResponse> {
	const response = await signup(data);
	if (!response.success) {
		throw new Error(response.error);
	}
	return response;
}

export function useSignUpMutation() {
	return useMutation({
		mutationFn: (formData: SignUpData) => signUpApiCall(formData),
	});
}
