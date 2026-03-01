'use client';

import { getUserByEmail } from '@/app/(dashboard)/users/actions';
import { login, AuthResponse } from '@/app/auth/actions';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export type LogInData = {
	email: string;
	password: string;
};

async function logInApiCall(data: LogInData): Promise<AuthResponse> {
	const response = await login(data);
	if (!response.success) {
		throw new Error(response.error);
	}
	return response;
}

export function useLogInMutation() {
	const router = useRouter();
	return useMutation({
		mutationFn: (formData: LogInData) => logInApiCall(formData),
		onSuccess: () => {
			router.refresh();
			router.push('/');
		},
	});
}
