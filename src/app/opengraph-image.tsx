import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ClicknCut - Corte Láser Personalizado';
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
					<svg
						width='80'
						height='80'
						viewBox='0 0 151 135'
						style={{ marginRight: 20 }}
					>
						<path fill='#d05f43' d='M37.3524 89.0743L23.6203 112.818L33.4952 129.894L50.2361 100.953L66.9771 71.9976H33.4952H0L9.87491 89.0743H37.3524Z' />
						<path fill='#d05f43' d='M37.7103 45.3177H10.2328L0.35791 62.3944H33.8398H67.335L50.594 33.4394L33.8398 4.49756L23.9649 21.5743L37.7103 45.3177Z' />
						<path fill='#d05f43' d='M75.858 23.7434L62.1126 0H42.3628L59.1038 28.9418L75.858 57.8836L92.5989 28.9418L109.34 0H89.59L75.858 23.7434Z' />
						<path fill='#d05f43' d='M113.648 45.9261L127.393 22.1827L117.518 5.10596L100.764 34.061L84.0229 63.0028H117.518H151L141.125 45.9261H113.648Z' />
						<path fill='#d05f43' d='M113.29 89.6826H140.767L150.655 72.6191H117.16H83.665L100.419 101.561L117.16 130.503L127.035 113.426L113.29 89.6826Z' />
						<path fill='#d05f43' d='M75.1421 111.256L88.8874 135H108.637L91.8963 106.058L75.1421 77.1162L58.4011 106.058L41.6602 135H61.41L75.1421 111.256Z' />
					</svg>
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
					Corte Láser Personalizado
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
										background: '#d05f43',
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
					clickncut.app
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
