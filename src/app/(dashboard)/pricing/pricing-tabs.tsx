'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FixedCostsTab } from './fixed-costs-tab';
import { ProductionVarsTab } from './production-vars-tab';
import { DiscountsTab } from './discounts-tab';
import { FormulasTab } from './formulas-tab';
import { ShippingTiersTab } from './shipping-tiers-tab';

interface PricingTabsProps {
	fixedCosts: any[];
	config: any | null;
	volumeDiscounts: any[];
	shippingTiers: any[];
}

export function PricingTabs({
	fixedCosts,
	config,
	volumeDiscounts,
	shippingTiers,
}: PricingTabsProps) {
	return (
		<Tabs defaultValue='fixed-costs'>
			<TabsList className='grid w-full grid-cols-5'>
				<TabsTrigger value='fixed-costs'>Costos Fijos</TabsTrigger>
				<TabsTrigger value='production-vars'>
					Variables
				</TabsTrigger>
				<TabsTrigger value='discounts'>
					Márgenes
				</TabsTrigger>
				<TabsTrigger value='shipping'>
					Envío
				</TabsTrigger>
				<TabsTrigger value='formulas'>
					Fórmulas
				</TabsTrigger>
			</TabsList>

			<TabsContent value='fixed-costs' className='mt-6'>
				<FixedCostsTab fixedCosts={fixedCosts} />
			</TabsContent>

			<TabsContent value='production-vars' className='mt-6'>
				<ProductionVarsTab config={config} />
			</TabsContent>

			<TabsContent value='discounts' className='mt-6'>
				<DiscountsTab
					config={config}
					volumeDiscounts={volumeDiscounts}
				/>
			</TabsContent>

			<TabsContent value='shipping' className='mt-6'>
				<ShippingTiersTab shippingTiers={shippingTiers} />
			</TabsContent>

			<TabsContent value='formulas' className='mt-6'>
				<FormulasTab />
			</TabsContent>
		</Tabs>
	);
}
