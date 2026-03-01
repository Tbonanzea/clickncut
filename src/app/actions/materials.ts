'use server';

import { prisma } from '@/lib/prisma';

export interface MaterialWithTypes {
	id: string;
	name: string;
	description: string | null;
	types: {
		id: string;
		width: number;
		length: number;
		height: number;
		pricePerUnit: number;
		massPerUnit: number;
		stock: number;
		errorMargin: number;
		maxCutLength: number;
		minCutLength: number;
		maxCutWidth: number;
		minCutWidth: number;
		finish: string | null;
	}[];
}

/**
 * Server action to fetch all materials with their types
 * Used in quoting flow for material selection
 */
export async function getMaterials(): Promise<MaterialWithTypes[]> {
	try {
		const materials = await prisma.material.findMany({
			include: {
				types: {
					orderBy: {
						height: 'asc', // Order by thickness
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		});

		return materials;
	} catch (error) {
		console.error('Error fetching materials:', error);
		throw new Error('Failed to fetch materials');
	}
}
