'use client';

import { signOut } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { UserData } from './Header';

interface NavBarProps {
	user: UserData | null;
}

const navLinks = [
	{ href: '/', label: 'Inicio' },
	{ href: '/quoting', label: 'Cotizador' },
	{ href: '/guidelines', label: 'Guía' },
	{ href: '/about', label: 'Acerca de' },
];

function getUserInitials(user: UserData): string {
	if (user.firstName && user.lastName) {
		return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
	}
	if (user.firstName) {
		return user.firstName[0].toUpperCase();
	}
	// Fallback to email first letter
	return user.email[0].toUpperCase();
}

function getUserDisplayName(user: UserData): string {
	if (user.firstName && user.lastName) {
		return `${user.firstName} ${user.lastName}`;
	}
	if (user.firstName) {
		return user.firstName;
	}
	return user.email;
}

export default function NavBar({ user }: NavBarProps) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	return (
		<nav className='fixed top-0 left-0 w-full flex items-center justify-between h-18 px-4 md:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50'>
			{/* Brand */}
			<Link href='/' className='shrink-0'>
				<Image
					src='/images/logo.png'
					alt='ClicknCut'
					width={240}
					height={64}
					priority
					className='h-24 w-auto'
				/>
			</Link>

			{/* Desktop Navigation */}
			<div className='hidden md:flex items-center gap-1'>
				{navLinks.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
							isActive(link.href)
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
						}`}
					>
						{link.label}
					</Link>
				))}
				{user?.isAdmin && (
					<Link
						href='/dashboard'
						className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
							isActive('/dashboard')
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
						}`}
					>
						<LayoutDashboard className='size-4' />
						Admin
					</Link>
				)}
				{user ? (
					<div className='ml-2 pl-2 border-l'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='ghost'
									className='relative h-9 w-9 rounded-full'
									aria-label='Menú de usuario'
								>
									<Avatar size='sm'>
										<AvatarImage src='' alt={getUserDisplayName(user)} />
										<AvatarFallback>{getUserInitials(user)}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuLabel className='font-normal'>
									<div className='flex flex-col gap-1'>
										<p className='text-sm font-medium leading-none'>
											{getUserDisplayName(user)}
										</p>
										<p className='text-xs leading-none text-muted-foreground'>
											{user.email}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => signOut()}>
									<LogOut className='mr-2 size-4' />
									<span>Cerrar sesión</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				) : (
					<div className='ml-2 pl-2 border-l flex items-center gap-2'>
						<Button asChild variant='ghost' size='sm'>
							<Link href='/auth/login'>Iniciar sesión</Link>
						</Button>
						<Button asChild variant='default' size='sm'>
							<Link href='/auth/signup'>Registrarse</Link>
						</Button>
					</div>
				)}
			</div>

			{/* Mobile Menu */}
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild className='md:hidden'>
					<Button variant='ghost' size='icon' aria-label='Abrir menú'>
						<Menu className='size-5' />
					</Button>
				</SheetTrigger>
				<SheetContent side='right' className='w-72 p-0'>
					<SheetHeader className='border-b px-4 py-5'>
						<SheetTitle>
							<Image
								src='/images/logo.png'
								alt='ClicknCut'
								width={240}
								height={60}
								className='h-20 w-auto'
							/>
						</SheetTitle>
					</SheetHeader>
					<nav className='flex flex-col px-4 py-6'>
						<div className='flex flex-col gap-1'>
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setOpen(false)}
									className={`px-4 py-3.5 text-base font-medium rounded-lg transition-colors ${
										isActive(link.href)
											? 'bg-primary text-primary-foreground'
											: 'text-foreground hover:bg-accent'
									}`}
								>
									{link.label}
								</Link>
							))}
							{user?.isAdmin && (
								<Link
									href='/dashboard'
									onClick={() => setOpen(false)}
									className={`px-4 py-3.5 text-base font-medium rounded-lg transition-colors flex items-center gap-2 ${
										isActive('/dashboard')
											? 'bg-primary text-primary-foreground'
											: 'text-foreground hover:bg-accent'
									}`}
								>
									<LayoutDashboard className='size-5' />
									Admin
								</Link>
							)}
						</div>
						{user ? (
							<div className='mt-6 pt-6 border-t'>
								<div className='px-4 py-3 mb-3 bg-accent/50 rounded-lg'>
									<div className='flex items-center gap-3'>
										<Avatar size='default'>
											<AvatarImage src='' alt={getUserDisplayName(user)} />
											<AvatarFallback>{getUserInitials(user)}</AvatarFallback>
										</Avatar>
										<div className='flex flex-col gap-0.5 min-w-0'>
											<p className='text-sm font-medium leading-none truncate'>
												{getUserDisplayName(user)}
											</p>
											<p className='text-xs leading-none text-muted-foreground truncate'>
												{user.email}
											</p>
										</div>
									</div>
								</div>
								<Button
									variant='outline'
									className='w-full justify-start gap-2'
									onClick={() => {
										setOpen(false);
										signOut();
									}}
								>
									<LogOut className='size-4' />
									Cerrar sesión
								</Button>
							</div>
						) : (
							<div className='mt-6 pt-6 border-t flex flex-col gap-3'>
								<Button asChild variant='outline' size='lg' className='w-full'>
									<Link href='/auth/login' onClick={() => setOpen(false)}>
										Iniciar sesión
									</Link>
								</Button>
								<Button asChild variant='default' size='lg' className='w-full'>
									<Link href='/auth/signup' onClick={() => setOpen(false)}>
										Registrarse
									</Link>
								</Button>
							</div>
						)}
					</nav>
				</SheetContent>
			</Sheet>
		</nav>
	);
}
