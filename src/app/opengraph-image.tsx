import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ClicknCut - Corte Láser y CNC Personalizado';
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = 'image/png';

export default async function OGImage() {
	return new ImageResponse(
		(
			<div
				style={{
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #3d5a7f 100%)',
					fontFamily: 'system-ui, sans-serif',
				}}
			>
				{/* Logo area */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 40,
					}}
				>
					<div
						style={{
							width: 80,
							height: 80,
							borderRadius: 16,
							background: '#f97316',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 20,
						}}
					>
						<svg
							width='48'
							height='48'
							viewBox='0 0 24 24'
							fill='none'
							stroke='white'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
						</svg>
					</div>
					<span
						style={{
							fontSize: 72,
							fontWeight: 800,
							color: 'white',
							letterSpacing: '-0.02em',
						}}
					>
						ClicknCut
					</span>
				</div>

				{/* Tagline */}
				<div
					style={{
						fontSize: 36,
						color: 'rgba(255,255,255,0.9)',
						marginBottom: 48,
						textAlign: 'center',
						maxWidth: 800,
						lineHeight: 1.3,
					}}
				>
					Corte Láser y CNC Personalizado
				</div>

				{/* Features */}
				<div
					style={{
						display: 'flex',
						gap: 32,
					}}
				>
					{['Cotización Instantánea', 'Precisión Industrial', 'Entrega Rápida'].map(
						(feature) => (
							<div
								key={feature}
								style={{
									background: 'rgba(255,255,255,0.1)',
									borderRadius: 12,
									padding: '16px 24px',
									display: 'flex',
									alignItems: 'center',
									gap: 12,
								}}
							>
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: '50%',
										background: '#f97316',
									}}
								/>
								<span
									style={{
										fontSize: 20,
										color: 'white',
									}}
								>
									{feature}
								</span>
							</div>
						)
					)}
				</div>

				{/* URL */}
				<div
					style={{
						position: 'absolute',
						bottom: 40,
						fontSize: 20,
						color: 'rgba(255,255,255,0.6)',
					}}
				>
					clickncut.com
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
