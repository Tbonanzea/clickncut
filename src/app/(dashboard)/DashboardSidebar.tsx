'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	LayoutDashboard,
	Users,
	ShoppingCart,
	Package,
	Wrench,
	User,
	ClipboardList,
	Menu,
	Calculator,
} from 'lucide-react';

interface DashboardSidebarProps {
	isAdmin: boolean;
}

interface NavItem {
	href: string;
	label: string;
	icon: React.ReactNode;
}

export default function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	const adminNavItems: NavItem[] = [
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: <LayoutDashboard className='h-5 w-5' />,
		},
		{
			href: '/orders',
			label: 'Todas las Órdenes',
			icon: <ShoppingCart className='h-5 w-5' />,
		},
		{
			href: '/users',
			label: 'Usuarios',
			icon: <Users className='h-5 w-5' />,
		},
		{
			href: '/materials',
			label: 'Materiales',
			icon: <Package className='h-5 w-5' />,
		},
		{
			href: '/extras',
			label: 'Extras',
			icon: <Wrench className='h-5 w-5' />,
		},
		{
			href: '/pricing',
			label: 'Precios',
			icon: <Calculator className='h-5 w-5' />,
		},
	];

	const userNavItems: NavItem[] = [
		{
			href: '/my-orders',
			label: 'Mis Órdenes',
			icon: <ClipboardList className='h-5 w-5' />,
		},
	];

	const commonNavItems: NavItem[] = [
		{
			href: '/profile',
			label: 'Mi Perfil',
			icon: <User className='h-5 w-5' />,
		},
	];

	const mainNavItems = isAdmin ? adminNavItems : userNavItems;

	const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
		<Card className='border-0 shadow-none lg:border lg:shadow-sm'>
			<CardHeader className='pb-2'>
				<CardTitle className='text-lg'>
					{isAdmin ? 'Admin Panel' : 'Mi Cuenta'}
				</CardTitle>
			</CardHeader>
			<Separator />
			<ul className='px-2 py-2 flex flex-col gap-1'>
				{mainNavItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<li key={item.href}>
							<Button
								asChild
								variant={isActive ? 'secondary' : 'ghost'}
								className='w-full justify-start gap-3 min-h-[44px]'
								onClick={onItemClick}
							>
								<Link href={item.href}>
									{item.icon}
									<span className='text-sm'>{item.label}</span>
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
			<Separator />
			<ul className='px-2 py-2 flex flex-col gap-1'>
				{commonNavItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<li key={item.href}>
							<Button
								asChild
								variant={isActive ? 'secondary' : 'ghost'}
								className='w-full justify-start gap-3 min-h-[44px]'
								onClick={onItemClick}
							>
								<Link href={item.href}>
									{item.icon}
									<span className='text-sm'>{item.label}</span>
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
		</Card>
	);

	return (
		<>
			{/* Mobile: Hamburger menu + Sheet drawer */}
			<div className='lg:hidden fixed top-20 left-0 right-0 z-40 bg-background border-b px-4 py-2'>
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button
							variant='outline'
							size='sm'
							className='min-h-[44px] gap-2'
						>
							<Menu className='h-5 w-5' />
							<span>Menú</span>
						</Button>
					</SheetTrigger>
					<SheetContent side='left' className='w-72 p-0'>
						<SheetHeader className='p-4 border-b'>
							<SheetTitle>
								{isAdmin ? 'Admin Panel' : 'Mi Cuenta'}
							</SheetTitle>
						</SheetHeader>
						<div className='p-2'>
							<NavContent onItemClick={() => setOpen(false)} />
						</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Desktop: Fixed sidebar */}
			<nav className='hidden lg:block w-64 p-2 flex-shrink-0 border-r bg-muted/50'>
				<NavContent />
			</nav>
		</>
	);
}
