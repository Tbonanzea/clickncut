'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/permissions';

export type MaterialWithTypes = Awaited<ReturnType<typeof getMaterials>>[number];

type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

/**
 * Get all materials with their types (no pagination, used for selection)
 */
export async function getMaterials() {
	return prisma.material.findMany({
		include: {
			types: {
				orderBy: { height: 'asc' },
			},
			_count: {
				select: { cartItems: true },
			},
		},
		orderBy: { name: 'asc' },
	});
}

/**
 * Get paginated materials with optional sorting
 */
export async function getPaginatedMaterials(
	page = 1,
	limit = 10,
	sortBy: SortField = 'name',
	order: SortOrder = 'asc'
) {
	const offset = (page - 1) * limit;

	// Use array for stable sorting with id as tiebreaker
	const orderBy: Prisma.MaterialOrderByWithRelationInput[] = [
		{ [sortBy]: order },
		{ id: 'asc' }, // Stable tiebreaker for duplicate values
	];

	const [materials, total] = await Promise.all([
		prisma.material.findMany({
			skip: offset,
			take: limit,
			orderBy,
			include: {
				types: {
					orderBy: { height: 'asc' },
				},
				_count: {
					select: { cartItems: true },
				},
			},
		}),
		prisma.material.count(),
	]);

	return {
		materials,
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	};
}

/**
 * Get a single material by ID
 */
export async function getMaterialById(id: string) {
	return prisma.material.findUnique({
		where: { id },
		include: {
			types: {
				orderBy: { height: 'asc' },
			},
		},
	});
}

/**
 * Create a new material (admin only)
 */
export async function createMaterial(data: {
	name: string;
	description?: string;
}) {
	try {
		// Require admin permission
		await requireAdmin();

		const material = await prisma.material.create({
			data: {
				name: data.name,
				description: data.description || null,
			},
		});

		revalidatePath('/materials');
		return { success: true, material };
	} catch (error: any) {
		if (error.code === 'P2002') {
			return { success: false, error: 'Ya existe un material con ese nombre' };
		}
		return { success: false, error: error.message };
	}
}

/**
 * Update a material (admin only)
 */
export async function updateMaterial(
	id: string,
	data: {
		name?: string;
		description?: string;
	}
) {
	try {
		// Require admin permission
		await requireAdmin();

		const material = await prisma.material.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description ?? undefined,
			},
		});

		revalidatePath('/materials');
		revalidatePath(`/materials/${id}`);
		return { success: true, material };
	} catch (error: any) {
		if (error.code === 'P2002') {
			return { success: false, error: 'Ya existe un material con ese nombre' };
		}
		return { success: false, error: error.message };
	}
}

/**
 * Delete a material (admin only)
 */
export async function deleteMaterial(id: string) {
	try {
		// Require admin permission
		await requireAdmin();

		// Check if material has associated types or cart items
		const material = await prisma.material.findUnique({
			where: { id },
			include: {
				_count: {
					select: { types: true, cartItems: true },
				},
			},
		});

		if (!material) {
			return { success: false, error: 'Material no encontrado' };
		}

		if (material._count.types > 0) {
			return {
				success: false,
				error: 'No se puede eliminar: tiene tipos de material asociados',
			};
		}

		if (material._count.cartItems > 0) {
			return {
				success: false,
				error: 'No se puede eliminar: está siendo usado en carritos',
			};
		}

		await prisma.material.delete({
			where: { id },
		});

		revalidatePath('/materials');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

/**
 * Create a material type (admin only)
 */
export async function createMaterialType(
	materialId: string,
	data: {
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
		// Cutting parameters
		cuttingSpeed?: number | null;
		assistGas?: string | null;
		gasConsumption?: number | null;
		piercingTime?: number | null;
		sheetWeight?: number | null;
		finish?: string | null;
		gasPressure?: number | null;
		piercingDistance?: number | null;
	}
) {
	try {
		// Require admin permission
		await requireAdmin();

		const materialType = await prisma.materialType.create({
			data: {
				materialId,
				...data,
			},
		});

		revalidatePath('/materials');
		revalidatePath(`/materials/${materialId}`);
		return { success: true, materialType };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

/**
 * Update a material type (admin only)
 */
export async function updateMaterialType(
	id: string,
	data: {
		width?: number;
		length?: number;
		height?: number;
		pricePerUnit?: number;
		massPerUnit?: number;
		stock?: number;
		errorMargin?: number;
		maxCutLength?: number;
		minCutLength?: number;
		maxCutWidth?: number;
		minCutWidth?: number;
		// Cutting parameters
		cuttingSpeed?: number | null;
		assistGas?: string | null;
		gasConsumption?: number | null;
		piercingTime?: number | null;
		sheetWeight?: number | null;
		finish?: string | null;
		gasPressure?: number | null;
		piercingDistance?: number | null;
	}
) {
	try {
		// Require admin permission
		await requireAdmin();

		const materialType = await prisma.materialType.update({
			where: { id },
			data,
		});

		revalidatePath('/materials');
		return { success: true, materialType };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

/**
 * Delete a material type (admin only)
 */
export async function deleteMaterialType(id: string) {
	try {
		// Require admin permission
		await requireAdmin();

		// Check if material type is being used in orders
		const materialType = await prisma.materialType.findUnique({
			where: { id },
			include: {
				_count: {
					select: { orderItems: true },
				},
			},
		});

		if (!materialType) {
			return { success: false, error: 'Tipo de material no encontrado' };
		}

		if (materialType._count.orderItems > 0) {
			return {
				success: false,
				error: 'No se puede eliminar: está siendo usado en órdenes',
			};
		}

		await prisma.materialType.delete({
			where: { id },
		});

		revalidatePath('/materials');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
