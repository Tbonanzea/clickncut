import { getPricingData } from './actions';
import { PricingTabs } from './pricing-tabs';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
	title: 'Configuración de Precios',
	description: 'Administración de costos, variables y márgenes de cotización',
};

export default async function PricingPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect('/auth/login');

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { role: true },
	});

	if (dbUser?.role !== 'ADMIN') redirect('/dashboard');

	const { fixedCosts, config, volumeDiscounts } = await getPricingData();

	const totalFixedCost = fixedCosts
		.filter((fc) => fc.isActive)
		.reduce((sum, fc) => sum + fc.monthlyCost, 0);

	const monthlyAmortization =
		config && config.amortizationYears > 0
			? (config.machineValueUsd * config.usdToArsRate) /
				config.amortizationYears /
				12
			: 0;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold tracking-tight'>
					Configuración de Precios
				</h1>
				<p className='text-sm text-muted-foreground mt-1'>
					Costos fijos, variables de producción, márgenes y
					descuentos para la cotización automática
				</p>
			</div>

			{/* Summary KPIs */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
				<div className='p-4 bg-muted/50 border rounded-lg'>
					<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
						Costos fijos / mes
					</p>
					<p className='text-xl font-bold font-mono mt-1'>
						{formatPrice(totalFixedCost)}
					</p>
				</div>
				<div className='p-4 bg-muted/50 border rounded-lg'>
					<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
						Amortización / mes
					</p>
					<p className='text-xl font-bold font-mono mt-1'>
						{formatPrice(monthlyAmortization)}
					</p>
				</div>
				<div className='p-4 bg-muted/50 border rounded-lg'>
					<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
						Margen de ganancia
					</p>
					<p className='text-xl font-bold mt-1'>
						{config
							? `${(config.profitMargin * 100).toFixed(0)}%`
							: 'Sin configurar'}
					</p>
				</div>
				<div className='p-4 bg-muted/50 border rounded-lg'>
					<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
						Descuentos activos
					</p>
					<p className='text-xl font-bold mt-1'>
						{
							volumeDiscounts.filter((vd) => vd.isActive)
								.length
						}{' '}
						niveles
					</p>
				</div>
			</div>

			{/* Tabs */}
			<PricingTabs
				fixedCosts={fixedCosts}
				config={config}
				volumeDiscounts={volumeDiscounts}
			/>
		</div>
	);
}
