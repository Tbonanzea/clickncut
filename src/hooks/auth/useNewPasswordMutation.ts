'use client';

import { newPassword, AuthResponse } from '@/app/auth/actions';
import { useMutation } from '@tanstack/react-query';

export type NewPasswordData = {
	newPassword: string;
	emailRedirectTo: string;
};

async function newPasswordApiCall(data: NewPasswordData): Promise<AuthResponse> {
	const response = await newPassword(data);
	if (!response.success) {
		throw new Error(response.error);
	}
	return response;
}

export function useNewPasswordMutation() {
	return useMutation({
		mutationFn: (data: NewPasswordData) => newPasswordApiCall(data),
	});
}
