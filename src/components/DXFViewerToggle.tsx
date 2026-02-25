'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

// Loading skeleton for the DXF viewer
function ViewerSkeleton() {
	return (
		<div className='w-full border border-border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center' style={{ minHeight: '400px' }}>
			<div className='flex flex-col items-center gap-3 text-muted-foreground'>
				<Loader2 className='h-8 w-8 animate-spin' />
				<span className='text-sm'>Cargando visualizador...</span>
			</div>
		</div>
	);
}

// Lazy load the heavy Three.js viewers - only loaded when needed
const DXFViewerSimple = dynamic(() => import('./DXFViewer2D'), {
	loading: () => <ViewerSkeleton />,
	ssr: false,
});

const DXFViewer3D = dynamic(() => import('./DXFViewer3D'), {
	loading: () => <ViewerSkeleton />,
	ssr: false,
});

interface DXFViewerToggleProps {
	dxfUrl?: string;
	className?: string;
	thickness?: number; // Material thickness in mm - required for 3D view
	maxPackageWidth?: number; // Maximum package width in cm
	maxPackageHeight?: number; // Maximum package height in cm
	parsedDxf?: any; // Pre-parsed DXF object (bypasses fetch + parse)
}

type ViewMode = '2D' | '3D';

export default function DXFViewerToggle({
	dxfUrl,
	className = '',
	thickness,
	maxPackageWidth,
	maxPackageHeight,
	parsedDxf,
}: DXFViewerToggleProps) {
	const [viewMode, setViewMode] = useState<ViewMode>('2D');

	// 3D view is only available when thickness is specified and greater than 0
	const has3DView = thickness !== undefined && thickness > 0;

	if (!dxfUrl) {
		return (
			<div
				className={`flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-muted ${className}`}
			>
				<p className='text-sm text-muted-foreground'>
					No se pudo cargar la vista previa del archivo
				</p>
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-3 flex-1 ${className}`}>
			{/* Toggle Buttons - only show if 3D view is available */}
			{has3DView ? (
				<div className='flex gap-2 items-center justify-center'>
					<Button
						variant={viewMode === '2D' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setViewMode('2D')}
						className='min-w-[80px]'
					>
						2D View
					</Button>
					<Button
						variant={viewMode === '3D' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setViewMode('3D')}
						className='min-w-[80px]'
					>
						3D View
					</Button>
				</div>
			) : (
				<div className='flex items-center justify-center p-2 bg-muted/50 rounded-md'>
					<p className='text-sm text-muted-foreground'>
						Vista 2D únicamente (selecciona un espesor para ver en 3D)
					</p>
				</div>
			)}

			{/* Viewer Container */}
			<div className='w-full flex-1'>
				{viewMode === '2D' || !has3DView ? (
					<DXFViewerSimple
						dxfUrl={dxfUrl}
						className='w-full'
						showControls={false}
						maxPackageWidth={maxPackageWidth}
						maxPackageHeight={maxPackageHeight}
						parsedDxf={parsedDxf}
					/>
				) : (
					<DXFViewer3D
						dxfUrl={dxfUrl}
						className='w-full'
						showControls={false}
						thickness={thickness}
						maxPackageWidth={maxPackageWidth}
						maxPackageHeight={maxPackageHeight}
						parsedDxf={parsedDxf}
					/>
				)}
			</div>
		</div>
	);
}
