// app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import DashboardSidebar from './DashboardSidebar';

export const metadata: Metadata = {
	title: {
		template: '%s | Panel ClicknCut',
		default: 'Panel de Control',
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Verify user is authenticated
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/auth/login');
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (!dbUser) {
		redirect('/auth/login');
	}

	const isAdmin = dbUser.role === 'ADMIN';

	return (
		<div className='flex min-h-screen'>
			<DashboardSidebar isAdmin={isAdmin} />
			{/* Main content - add top padding on mobile for the menu bar */}
			<main className='flex-1 p-4 lg:p-8 overflow-auto pt-20 lg:pt-8'>
				{children}
			</main>
		</div>
	);
}
