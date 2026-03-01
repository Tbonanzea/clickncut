'use client';

import { evaluateBSplineCurve } from '@/lib/bspline';
import { computeTotalDXFArea, getClosedShapeFromEntity } from '@/lib/dxf-area';
import { validateDXF } from '@/lib/dxf-validation';
import { createCustomGrid, createPackageBoundary } from '@/lib/three-grid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial, OrbitControls } from 'three-stdlib';

interface DXFViewer2DProps {
	dxfUrl?: string;
	className?: string;
	showControls?: boolean; // Whether to show file upload and control buttons
	maxPackageWidth?: number; // Maximum package width in cm
	maxPackageHeight?: number; // Maximum package height in cm
	parsedDxf?: any; // Pre-parsed DXF object (bypasses fetch + parse)
}

const LINE_WIDTH = 2; // Line width in pixels

export default function DXFViewer2D({
	dxfUrl,
	className = '',
	showControls = true,
	maxPackageWidth,
	maxPackageHeight,
	parsedDxf,
}: DXFViewer2DProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const dxfObjectRef = useRef<THREE.Group | null>(null);
	const gridRef = useRef<THREE.Group | null>(null);
	const boundaryRef = useRef<Line2 | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const resolutionRef = useRef<THREE.Vector2>(new THREE.Vector2(1, 1));
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [entityCount, setEntityCount] = useState<number>(0);
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [area, setArea] = useState<number | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const initializeScene = () => {
			const width = containerRef.current!.clientWidth;
			const height = containerRef.current!.clientHeight || 600;
			const aspect = width / height;

			// Store resolution for LineMaterial
			resolutionRef.current.set(width, height);

			// Scene
			const scene = new THREE.Scene();
			scene.background = new THREE.Color(0xfafafa);
			sceneRef.current = scene;

			// Orthographic camera - better for 2D DXF viewing
			const frustumSize = 200;
			const camera = new THREE.OrthographicCamera(
				(-frustumSize * aspect) / 2,
				(frustumSize * aspect) / 2,
				frustumSize / 2,
				-frustumSize / 2,
				0.1,
				10000,
			);
			camera.position.set(0, 0, 100);
			cameraRef.current = camera;

			// Renderer
			const renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			containerRef.current!.appendChild(renderer.domElement);
			rendererRef.current = renderer;

			// Controls - configured for 2D panning/zooming
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.1;
			controls.enableRotate = false; // Disable rotation for 2D view
			controls.screenSpacePanning = true;
			controls.minZoom = 0.1;
			controls.maxZoom = 50;
			// Remap mouse buttons: left click for pan (2D view)
			controls.mouseButtons = {
				LEFT: THREE.MOUSE.PAN,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.ROTATE,
			};
			controlsRef.current = controls;

			// Grid will be added dynamically in parseDXF based on piece size

			// Animation loop
			const animate = () => {
				animationFrameRef.current = requestAnimationFrame(animate);
				controls.update();
				renderer.render(scene, camera);
			};
			animate();
		};

		initializeScene();

		const handleResize = () => {
			if (
				!containerRef.current ||
				!cameraRef.current ||
				!rendererRef.current
			)
				return;

			const width = containerRef.current.clientWidth;
			const height = containerRef.current.clientHeight || 600;
			const aspect = width / height;
			const frustumSize = 200;

			// Update resolution for LineMaterial
			resolutionRef.current.set(width, height);

			// Update all LineMaterial resolutions in the scene
			if (dxfObjectRef.current) {
				dxfObjectRef.current.traverse((child) => {
					if (child instanceof Line2) {
						const material = child.material as LineMaterial;
						if (material.resolution) {
							material.resolution.set(width, height);
						}
					}
				});
			}

			// Update boundary LineMaterial resolution
			if (boundaryRef.current) {
				const material = boundaryRef.current.material as LineMaterial;
				if (material.resolution) {
					material.resolution.set(width, height);
				}
			}

			cameraRef.current.left = (-frustumSize * aspect) / 2;
			cameraRef.current.right = (frustumSize * aspect) / 2;
			cameraRef.current.top = frustumSize / 2;
			cameraRef.current.bottom = -frustumSize / 2;
			cameraRef.current.updateProjectionMatrix();
			rendererRef.current.setSize(width, height);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}

			if (controlsRef.current) {
				controlsRef.current.dispose();
			}

			if (rendererRef.current) {
				rendererRef.current.dispose();
				rendererRef.current.domElement.remove();
			}
		};
	}, []);

	useEffect(() => {
		if (sceneRef.current) {
			if (parsedDxf) {
				// Use pre-parsed DXF directly
				setIsLoading(true);
				setError(null);
				setValidationErrors([]);
				renderParsedDXF(parsedDxf)
					.catch((err) => {
						console.error('Error rendering parsed DXF:', err);
						setError(
							'Error rendering DXF: ' + (err as Error).message,
						);
					})
					.finally(() => {
						setIsLoading(false);
					});
			} else if (dxfUrl) {
				// Fallback: load from URL
				loadDXFFromPath(dxfUrl);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dxfUrl, parsedDxf, maxPackageWidth, maxPackageHeight]);

	const fitCameraToObject = useCallback(
		(
			object: THREE.Group,
			pieceBounds?: { width: number; height: number },
		) => {
			if (
				!cameraRef.current ||
				!controlsRef.current ||
				!containerRef.current
			)
				return;

			const box = new THREE.Box3().setFromObject(object);
			if (box.isEmpty()) return;

			const size = box.getSize(new THREE.Vector3());

			// Store dimensions (DXF units are typically mm)
			setDimensions({
				width: Math.abs(size.x),
				height: Math.abs(size.y),
			});

			const width = containerRef.current.clientWidth;
			const height = containerRef.current.clientHeight || 600;
			const aspect = width / height;

			// Zoom based on piece dimensions only (ignore package boundary)
			const maxDim = Math.max(size.x, size.y / aspect);
			const padding = 1.8;
			const zoom = 200 / (maxDim * padding);

			cameraRef.current.zoom = Math.max(0.1, Math.min(zoom, 50));
			cameraRef.current.position.set(0, 0, 100); // Target origin since piece is centered
			cameraRef.current.updateProjectionMatrix();

			controlsRef.current.target.set(0, 0, 0); // Target origin
			controlsRef.current.update();
		},
		[maxPackageWidth, maxPackageHeight],
	);

	const loadDXFFromPath = async (path: string) => {
		if (!sceneRef.current) return;

		setIsLoading(true);
		setError(null);
		setValidationErrors([]);

		try {
			console.log('Loading DXF from:', path);

			const response = await fetch(path);
			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`,
				);
			}

			const dxfString = await response.text();
			await parseDXF(dxfString);
		} catch (err) {
			console.error('Error loading DXF:', err);
			setError('Error loading DXF file: ' + (err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	// Render pre-parsed DXF (bypasses fetch + parse)
	const renderParsedDXF = async (dxf: any) => {
		if (!sceneRef.current) return;

		try {
			console.log('Rendering pre-parsed DXF:', dxf);

			if (!dxf) {
				throw new Error('Invalid DXF object');
			}

			// Validate the DXF file - this blocks on errors
			const validationResult = validateDXF(dxf);
			if (!validationResult.isValid) {
				setValidationErrors(validationResult.errors);
				const errorMessage = validationResult.errors.join('\n• ');
				throw new Error(`Invalid DXF file:\n• ${errorMessage}`);
			}

			setValidationErrors([]);

			// Continue with rendering (same as parseDXF below)
			await renderDXFToScene(dxf);
		} catch (err) {
			console.error('Error rendering parsed DXF:', err);
			throw err;
		}
	};

	const parseDXF = async (dxfString: string) => {
		if (!sceneRef.current) return;

		try {
			const DxfParser = (await import('dxf-parser')).default;
			const parser = new DxfParser();
			const dxf = parser.parseSync(dxfString);

			console.log('DXF parsed:', dxf);

			if (!dxf) {
				throw new Error('Failed to parse DXF file');
			}

			// Validate the DXF file - this blocks on errors
			const validationResult = validateDXF(dxf);
			if (!validationResult.isValid) {
				setValidationErrors(validationResult.errors);
				const errorMessage = validationResult.errors.join('\n• ');
				throw new Error(`Invalid DXF file:\n• ${errorMessage}`);
			}

			setValidationErrors([]);

			await renderDXFToScene(dxf);
		} catch (err) {
			console.error('Error parsing DXF:', err);
			throw err;
		}
	};

	// Extract rendering logic into separate function
	const renderDXFToScene = async (dxf: any) => {
		if (!sceneRef.current) return;

		// Dispose previous object and its resources
		if (dxfObjectRef.current) {
			disposeObject(dxfObjectRef.current);
			sceneRef.current.remove(dxfObjectRef.current);
		}

		const group = new THREE.Group();
		let renderedCount = 0;

		// Parse entities
		if (dxf.entities && Array.isArray(dxf.entities)) {
			// Log closed entities analysis
			let closedCount = 0;
			const closedByType: Record<string, number> = {};
			dxf.entities.forEach((entity: any) => {
				const closed = getClosedShapeFromEntity(entity);
				if (closed) {
					closedCount++;
					closedByType[entity.type] =
						(closedByType[entity.type] || 0) + 1;
				}
			});
			console.log(
				`[DXF2D] Total entities: ${dxf.entities.length} | Closed entities: ${closedCount}`,
				closedByType,
			);

			dxf.entities.forEach((entity: any) => {
				try {
					const mesh = createEntityMesh(entity);
					if (mesh) {
						group.add(mesh);
						renderedCount++;
					}
				} catch (err) {
					console.warn('Error processing entity:', entity.type, err);
				}
			});
		}

		if (group.children.length === 0) {
			throw new Error('No valid entities found in DXF file');
		}

		// Center the piece at the origin
		const box = new THREE.Box3().setFromObject(group);
		const center = box.getCenter(new THREE.Vector3());
		group.position.set(-center.x, -center.y, -center.z);

		// Get piece dimensions for grid
		const size = box.getSize(new THREE.Vector3());
		const pieceBounds = {
			width: Math.abs(size.x),
			height: Math.abs(size.y),
		};

		// Dispose previous grid and boundary
		if (gridRef.current) {
			disposeObject(gridRef.current);
			sceneRef.current.remove(gridRef.current);
			gridRef.current = null;
		}
		if (boundaryRef.current) {
			boundaryRef.current.geometry?.dispose();
			(boundaryRef.current.material as LineMaterial)?.dispose();
			sceneRef.current.remove(boundaryRef.current);
			boundaryRef.current = null;
		}

		// Create dynamic grid based on piece size
		const customGrid = createCustomGrid({
			pieceBounds,
			cellSize: 10, // 10mm = 1cm
			paddingMultiplier: 2.0,
			minExtension: 300, // 30cm minimum
		});
		gridRef.current = customGrid;
		sceneRef.current.add(customGrid);

		// Create package boundary if dimensions are provided
		// Auto-align: swap package dimensions so its longest side matches the piece's longest side
		if (maxPackageWidth && maxPackageHeight) {
			let pkgW = maxPackageWidth * 10; // Convert cm to mm
			let pkgH = maxPackageHeight * 10;

			const pieceIsWiderThanTall =
				pieceBounds.width >= pieceBounds.height;
			const packageIsWiderThanTall = pkgW >= pkgH;

			if (pieceIsWiderThanTall !== packageIsWiderThanTall) {
				[pkgW, pkgH] = [pkgH, pkgW];
			}

			const boundary = createPackageBoundary({
				width: pkgW,
				height: pkgH,
				resolution: resolutionRef.current,
			});
			boundaryRef.current = boundary;
			sceneRef.current.add(boundary);
		}

		dxfObjectRef.current = group;
		sceneRef.current.add(group);
		setEntityCount(renderedCount);

		// Compute total area using contour chaining
		if (dxf.entities) {
			const totalArea = computeTotalDXFArea(dxf.entities, dxf.blocks);
			setArea(totalArea > 0 ? totalArea : null);
		}

		fitCameraToObject(group, pieceBounds);

		console.log('DXF rendered with', renderedCount, 'entities');
	};

	// Properly dispose Three.js objects to prevent memory leaks
	const disposeObject = (object: THREE.Object3D) => {
		object.traverse((child) => {
			if (child instanceof Line2) {
				child.geometry?.dispose();
				if (child.material) {
					(child.material as LineMaterial).dispose();
				}
			}
			if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
				child.geometry?.dispose();
				if (child.material) {
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			}
			if (child instanceof THREE.Points) {
				child.geometry?.dispose();
				if (child.material instanceof THREE.PointsMaterial) {
					child.material.dispose();
				}
			}
		});
	};

	const createLine2FromPoints = (
		points: THREE.Vector3[],
		color: number,
	): Line2 => {
		const geometry = new LineGeometry();
		const positions: number[] = [];
		points.forEach((p) => {
			positions.push(p.x, p.y, p.z);
		});
		geometry.setPositions(positions);

		const material = new LineMaterial({
			color: color,
			linewidth: LINE_WIDTH,
			resolution: resolutionRef.current,
			worldUnits: false, // Use screen-space line width
		});

		return new Line2(geometry, material);
	};

	const createEntityMesh = (entity: any): THREE.Object3D | null => {
		const color = getEntityColor(entity);

		switch (entity.type) {
			case 'LINE': {
				if (!entity.vertices || entity.vertices.length < 2) return null;
				const points = [
					new THREE.Vector3(
						entity.vertices[0].x,
						entity.vertices[0].y,
						entity.vertices[0].z || 0,
					),
					new THREE.Vector3(
						entity.vertices[1].x,
						entity.vertices[1].y,
						entity.vertices[1].z || 0,
					),
				];
				return createLine2FromPoints(points, color);
			}

			case 'LWPOLYLINE':
			case 'POLYLINE': {
				if (!entity.vertices || entity.vertices.length < 2) return null;
				const points = entity.vertices.map(
					(v: any) => new THREE.Vector3(v.x, v.y, v.z || 0),
				);
				// Close the polyline if shape is closed
				if (entity.shape) {
					points.push(points[0].clone());
				}
				return createLine2FromPoints(points, color);
			}

			case 'CIRCLE': {
				// Create circle from points
				const segments = 64;
				const points: THREE.Vector3[] = [];
				for (let i = 0; i <= segments; i++) {
					const theta = (i / segments) * Math.PI * 2;
					points.push(
						new THREE.Vector3(
							entity.center.x + entity.radius * Math.cos(theta),
							entity.center.y + entity.radius * Math.sin(theta),
							entity.center.z || 0,
						),
					);
				}
				return createLine2FromPoints(points, color);
			}

			case 'ARC': {
				// DXF arcs go counter-clockwise from startAngle to endAngle
				const cx = entity.center.x;
				const cy = entity.center.y;
				const cz = entity.center.z || 0;
				const r = entity.radius;

				const startAngle = entity.startAngle;
				const endAngle = entity.endAngle;

				// Calculate sweep angle (always counter-clockwise in DXF)
				let sweep = endAngle - startAngle;
				if (sweep <= 0) {
					sweep += 2 * Math.PI;
				}

				const points: THREE.Vector3[] = [];
				const segments = Math.max(
					32,
					Math.ceil((sweep / Math.PI) * 32),
				);

				for (let i = 0; i <= segments; i++) {
					const t = i / segments;
					const angle = startAngle + t * sweep;
					points.push(
						new THREE.Vector3(
							cx + r * Math.cos(angle),
							cy + r * Math.sin(angle),
							cz,
						),
					);
				}
				return createLine2FromPoints(points, color);
			}

			case 'ELLIPSE': {
				if (!entity.center || !entity.majorAxisEndPoint) return null;
				const majorRadius = Math.sqrt(
					entity.majorAxisEndPoint.x ** 2 +
						entity.majorAxisEndPoint.y ** 2,
				);
				const minorRadius = majorRadius * entity.axisRatio;
				const rotation = Math.atan2(
					entity.majorAxisEndPoint.y,
					entity.majorAxisEndPoint.x,
				);
				const startAngle = entity.startAngle || 0;
				const endAngle = entity.endAngle || Math.PI * 2;

				const curve = new THREE.EllipseCurve(
					entity.center.x,
					entity.center.y,
					majorRadius,
					minorRadius,
					startAngle,
					endAngle,
					false,
					rotation,
				);
				const curvePoints = curve.getPoints(64);
				const points = curvePoints.map(
					(p) => new THREE.Vector3(p.x, p.y, entity.center.z || 0),
				);
				return createLine2FromPoints(points, color);
			}

			case 'SPLINE': {
				if (!entity.controlPoints || entity.controlPoints.length < 2)
					return null;
				if (
					entity.knotValues &&
					entity.knotValues.length > 0 &&
					entity.degreeOfSplineCurve
				) {
					// Proper B-spline evaluation using De Boor algorithm
					const cp = entity.controlPoints.map((p: any) => ({
						x: p.x,
						y: p.y,
						z: p.z || 0,
					}));
					const evaluated = evaluateBSplineCurve(
						entity.degreeOfSplineCurve,
						cp,
						entity.knotValues,
					);
					const points = evaluated.map(
						(p) => new THREE.Vector3(p.x, p.y, p.z),
					);
					return createLine2FromPoints(points, color);
				}
				if (entity.fitPoints && entity.fitPoints.length >= 2) {
					// Fit points: CatmullRom is correct interpolation
					const fitPts = entity.fitPoints.map(
						(p: any) => new THREE.Vector3(p.x, p.y, p.z || 0),
					);
					const curve = new THREE.CatmullRomCurve3(fitPts);
					const points = curve.getPoints(
						entity.fitPoints.length * 10,
					);
					return createLine2FromPoints(points, color);
				}
				// Fallback: connect control points directly
				const points = entity.controlPoints.map(
					(p: any) => new THREE.Vector3(p.x, p.y, p.z || 0),
				);
				return createLine2FromPoints(points, color);
			}

			case 'POINT': {
				const pointGeometry = new THREE.BufferGeometry();
				pointGeometry.setAttribute(
					'position',
					new THREE.Float32BufferAttribute(
						[
							entity.position.x,
							entity.position.y,
							entity.position.z || 0,
						],
						3,
					),
				);
				const pointMaterial = new THREE.PointsMaterial({
					color: color,
					size: 5,
					sizeAttenuation: false,
				});
				return new THREE.Points(pointGeometry, pointMaterial);
			}

			default:
				console.log('Unsupported entity type:', entity.type);
				return null;
		}
	};

	const getEntityColor = (entity: any): number => {
		// Use entity color if available, otherwise default to black
		if (entity.color !== undefined && entity.color !== 256) {
			// AutoCAD color index - simplified mapping
			const colorMap: Record<number, number> = {
				1: 0xff0000, // Red
				2: 0xffff00, // Yellow
				3: 0x00ff00, // Green
				4: 0x00ffff, // Cyan
				5: 0x0000ff, // Blue
				6: 0xff00ff, // Magenta
				7: 0x000000, // White/Black
			};
			return colorMap[entity.color] || 0x000000;
		}
		return 0x000000;
	};

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file || !sceneRef.current) return;

		setSelectedFile(file);
		setIsLoading(true);
		setError(null);
		setValidationErrors([]);

		try {
			const text = await file.text();
			await parseDXF(text);
		} catch (err) {
			console.error('Error loading file:', err);
			setError('Error loading file: ' + (err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClear = () => {
		if (sceneRef.current && dxfObjectRef.current) {
			disposeObject(dxfObjectRef.current);
			sceneRef.current.remove(dxfObjectRef.current);
			dxfObjectRef.current = null;
		}
		setSelectedFile(null);
		setError(null);
		setValidationErrors([]);
		setEntityCount(0);
		setDimensions(null);
		setArea(null);

		// Reset camera
		if (cameraRef.current && controlsRef.current) {
			cameraRef.current.zoom = 1;
			cameraRef.current.position.set(0, 0, 100);
			cameraRef.current.updateProjectionMatrix();
			controlsRef.current.target.set(0, 0, 0);
			controlsRef.current.update();
		}
	};

	const handleReset = () => {
		if (dxfObjectRef.current) {
			fitCameraToObject(dxfObjectRef.current);
		}
	};

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			{showControls && (
				<div className='flex flex-wrap gap-4 items-center'>
					<div className='flex gap-2'>
						<input
							type='file'
							accept='.dxf'
							onChange={handleFileSelect}
							className='block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
						/>
						<button
							onClick={handleClear}
							disabled={!selectedFile && !dxfUrl}
							className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
						>
							Clear
						</button>
						<button
							onClick={handleReset}
							className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600'
						>
							Reset View
						</button>
					</div>
					{(selectedFile || entityCount > 0) && (
						<span className='text-sm text-gray-600'>
							{selectedFile?.name || 'Loaded file'}
							{entityCount > 0 && (
								<span className='ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded'>
									{entityCount} entities
								</span>
							)}
						</span>
					)}
				</div>
			)}

			{dimensions && (
				<div className='flex gap-3 text-sm flex-wrap'>
					<span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded'>
						W: {dimensions.width.toFixed(2)} mm
					</span>
					<span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded'>
						H: {dimensions.height.toFixed(2)} mm
					</span>
					{area !== null && area > 0 && (
						<span className='px-2 py-0.5 bg-purple-100 text-purple-700 rounded'>
							A: {(area / 100).toFixed(2)} cm²
						</span>
					)}
				</div>
			)}

			{error && (
				<div className='p-4 bg-red-50 border border-red-200 rounded-md'>
					<h4 className='font-semibold text-red-800 mb-2'>Error</h4>
					<p className='text-red-700 whitespace-pre-wrap'>{error}</p>
				</div>
			)}

			{validationErrors.length > 0 && !error && (
				<div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
					<h4 className='font-semibold text-yellow-800 mb-2'>
						Advertencias de validación
					</h4>
					<ul className='list-disc list-inside text-yellow-700 space-y-1'>
						{validationErrors.map((err, idx) => (
							<li key={idx} className='text-sm'>
								{err}
							</li>
						))}
					</ul>
				</div>
			)}

			{isLoading && (
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700'>
					Cargando archivo DXF...
				</div>
			)}

			<div
				ref={containerRef}
				className='w-full flex-1 border border-gray-300 rounded-md overflow-hidden bg-gray-100'
				style={{ minHeight: '400px' }}
			/>

			{showControls && (
				<div className='text-sm text-gray-600 space-y-1'>
					<p>
						<strong>Controls:</strong>
					</p>
					<ul className='list-disc list-inside ml-4'>
						<li>Left click + drag: Pan</li>
						<li>Mouse wheel: Zoom</li>
					</ul>
				</div>
			)}
		</div>
	);
}
