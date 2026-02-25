'use client';

import {
	evaluateBSplineCurve,
	getBSplineEndPoint,
	getBSplineStartPoint,
} from '@/lib/bspline';
import { computeTotalDXFArea, getClosedShapeFromEntity } from '@/lib/dxf-area';
import { validateDXF } from '@/lib/dxf-validation';
import { createCustomGrid, createPackageBoundary } from '@/lib/three-grid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial, OrbitControls } from 'three-stdlib';

interface DXFViewer3DProps {
	dxfUrl?: string;
	className?: string;
	showControls?: boolean; // Whether to show file upload and control buttons
	thickness?: number; // Material thickness in mm for 3D extrusion visualization
	maxPackageWidth?: number; // Maximum package width in cm
	maxPackageHeight?: number; // Maximum package height in cm
	parsedDxf?: any; // Pre-parsed DXF object (bypasses fetch + parse)
}

const LINE_WIDTH = 2; // Line width in pixels

export default function DXFViewer3D({
	dxfUrl,
	className = '',
	showControls = true,
	thickness,
	maxPackageWidth,
	maxPackageHeight,
	parsedDxf,
}: DXFViewer3DProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
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
		depth: number;
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

			// PerspectiveCamera for 3D viewing
			const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
			camera.position.set(0, -100, 100);
			camera.up.set(0, 0, 1); // Z-up for DXF files
			cameraRef.current = camera;

			// Renderer
			const renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(width, height);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			containerRef.current!.appendChild(renderer.domElement);
			rendererRef.current = renderer;

			// Controls - configured for 3D rotation/panning/zooming
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.1;
			controls.enableRotate = true; // Enable rotation for 3D view
			controls.screenSpacePanning = true;
			controls.minDistance = 1;
			controls.maxDistance = 5000;
			controlsRef.current = controls;

			// Add lighting for depth perception
			const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
			scene.add(ambientLight);

			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
			directionalLight.position.set(50, 50, 100);
			scene.add(directionalLight);

			// Grid will be added dynamically in parseDXF based on piece size

			// Add axis helper
			const axisHelper = new THREE.AxesHelper(50);
			scene.add(axisHelper);

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

			cameraRef.current.aspect = aspect;
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
	}, [dxfUrl, parsedDxf, thickness, maxPackageWidth, maxPackageHeight]);

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
				depth: Math.abs(size.z),
			});

			// Zoom based on piece dimensions only (ignore package boundary)
			const maxDim = Math.max(size.x, size.y, size.z);
			const fov = cameraRef.current.fov * (Math.PI / 180);
			const distance = (maxDim / 2 / Math.tan(fov / 2)) * 1.6; // tight fit

			// Position camera at an angle for 3D view, targeting origin
			const angle = Math.PI / 4; // 45 degrees
			cameraRef.current.position.set(
				distance * Math.sin(angle) * 0.5,
				-distance * Math.cos(angle) * 0.5,
				distance * 0.7,
			);
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
				`[DXF3D] Total entities: ${dxf.entities.length} | Closed entities: ${closedCount}`,
				closedByType,
			);

			if (hasThickness) {
				// Collect single-entity closed shapes and chainable segments
				const singleClosedShapes: {
					shape: THREE.Shape;
					area: number;
					isAssembled: false;
				}[] = [];
				const chainableSegments: {
					start: { x: number; y: number };
					end: { x: number; y: number };
					entity: any;
				}[] = [];
				const remainingEntities: any[] = [];

				dxf.entities.forEach((entity: any) => {
					const closed = getClosedShapeFromEntity(entity);
					if (closed) {
						singleClosedShapes.push({
							...closed,
							isAssembled: false,
						});
					} else {
						const seg = getSegmentEndpoints(entity);
						if (seg) {
							chainableSegments.push({ ...seg, entity });
						} else {
							remainingEntities.push(entity);
						}
					}
				});

				// Assemble chainable segments into closed loops
				const assembledShapes = assembleClosedPaths(chainableSegments);

				// Combine all closed shapes with metadata
				const allClosedShapes = [
					...assembledShapes.map((s) => ({
						shape: s.shape,
						area: s.area,
						isAssembled: true,
					})),
					...singleClosedShapes,
				];

				console.log(
					'[DXF3D] Single closed entities:',
					singleClosedShapes.length,
					'| Assembled paths:',
					assembledShapes.length,
					'(from',
					chainableSegments.length,
					'segments)',
					'| Remaining:',
					remainingEntities.length,
				);

				if (allClosedShapes.length > 0) {
					// Sort by area descending - largest is the outer boundary
					allClosedShapes.sort((a, b) => b.area - a.area);

					// Point-in-polygon test for containment
					const pointInShape = (
						px: number,
						py: number,
						shapePoints: THREE.Vector2[],
					) => {
						let inside = false;
						for (
							let i = 0, j = shapePoints.length - 1;
							i < shapePoints.length;
							j = i++
						) {
							const xi = shapePoints[i].x,
								yi = shapePoints[i].y;
							const xj = shapePoints[j].x,
								yj = shapePoints[j].y;
							if (
								yi > py !== yj > py &&
								px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
							) {
								inside = !inside;
							}
						}
						return inside;
					};

					// Compute centroid and points for each shape
					const shapeData = allClosedShapes.map((s) => {
						const pts = s.shape.getPoints(64);
						let cx = 0,
							cy = 0;
						for (const p of pts) {
							cx += p.x;
							cy += p.y;
						}
						cx /= pts.length;
						cy /= pts.length;
						return {
							...s,
							pts,
							cx,
							cy,
							isAssembled: s.isAssembled,
						};
					});

					// Determine nesting depth using even-odd rule
					// Depth 0 = outer boundary (material), depth 1 = hole, depth 2 = island, etc.
					const depths = shapeData.map((s, i) => {
						let depth = 0;
						for (let j = 0; j < shapeData.length; j++) {
							if (j === i) continue;
							// Only count larger shapes as potential parents
							if (shapeData[j].area <= s.area) continue;
							if (pointInShape(s.cx, s.cy, shapeData[j].pts)) {
								depth++;
							}
						}
						return depth;
					});

					// Depth 0: outer boundary (material)
					// Depth 1: holes in outer boundary
					// Depth 2: islands inside holes (material again)
					// Depth 3: holes inside islands, etc.

					// Build the outer shape with depth-1 holes
					const outerShape = shapeData[0].shape;
					const _outerIsAssembled = shapeData[0].isAssembled;
					for (let i = 1; i < shapeData.length; i++) {
						if (depths[i] !== 1) continue; // Only direct holes
						const holePoints = shapeData[i].pts;
						const isCW = THREE.ShapeUtils.isClockWise(holePoints);
						const orderedPoints = isCW
							? holePoints
							: [...holePoints].reverse();
						const holePath = new THREE.Path();
						holePath.moveTo(orderedPoints[0].x, orderedPoints[0].y);
						for (let j = 1; j < orderedPoints.length; j++) {
							holePath.lineTo(
								orderedPoints[j].x,
								orderedPoints[j].y,
							);
						}
						holePath.closePath();
						outerShape.holes.push(holePath);
					}

					const extruded = createExtrudedShape(
						outerShape,
						0x333333,
						0,
					);
					group.add(extruded);
					renderedCount += allClosedShapes.length;

					// Extrude islands (depth 2+) as separate filled shapes
					for (let i = 1; i < shapeData.length; i++) {
						if (depths[i] < 2 || depths[i] % 2 !== 0) continue; // Even depth = material
						const islandShape = shapeData[i].shape;
						const _islandIsAssembled = shapeData[i].isAssembled;
						// Add any depth+1 shapes inside this island as holes
						for (let j = 0; j < shapeData.length; j++) {
							if (j === i || depths[j] !== depths[i] + 1)
								continue;
							if (
								pointInShape(
									shapeData[j].cx,
									shapeData[j].cy,
									shapeData[i].pts,
								)
							) {
								const holePoints = shapeData[j].pts;
								const isCW =
									THREE.ShapeUtils.isClockWise(holePoints);
								const orderedPoints = isCW
									? holePoints
									: [...holePoints].reverse();
								const holePath = new THREE.Path();
								holePath.moveTo(
									orderedPoints[0].x,
									orderedPoints[0].y,
								);
								for (let k = 1; k < orderedPoints.length; k++) {
									holePath.lineTo(
										orderedPoints[k].x,
										orderedPoints[k].y,
									);
								}
								holePath.closePath();
								islandShape.holes.push(holePath);
							}
						}
						const islandExtruded = createExtrudedShape(
							islandShape,
							0x333333,
							0,
						);
						group.add(islandExtruded);
					}
				}

				// Render any remaining entities that couldn't be assembled
				remainingEntities.forEach((entity: any) => {
					try {
						const mesh = createEntityMesh(entity);
						if (mesh) {
							group.add(mesh);
							renderedCount++;
						}
					} catch (err) {
						console.warn(
							'Error processing entity:',
							entity.type,
							err,
						);
					}
				});

				// Also render unused segments (not part of any closed loop)
				assembledShapes.forEach((s) => {
					s.unusedSegments.forEach((entity: any) => {
						try {
							const mesh = createEntityMesh(entity);
							if (mesh) {
								group.add(mesh);
								renderedCount++;
							}
						} catch (err) {
							console.warn(
								'Error processing entity:',
								entity.type,
								err,
							);
						}
					});
				});
			} else {
				// Standard approach: process each entity individually
				dxf.entities.forEach((entity: any) => {
					try {
						const mesh = createEntityMesh(entity);
						if (mesh) {
							group.add(mesh);
							renderedCount++;
						}
					} catch (err) {
						console.warn(
							'Error processing entity:',
							entity.type,
							err,
						);
					}
				});
			}
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

		// Create package boundary if dimensions are provided (at z=0, base of extruded piece)
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

	// Create an extruded 3D mesh from a THREE.Shape
	const createExtrudedShape = (
		shape: THREE.Shape,
		color: number,
		baseZ: number,
	): THREE.Group => {
		const group = new THREE.Group();

		const extrudeSettings: THREE.ExtrudeGeometryOptions = {
			depth: thickness!,
			bevelEnabled: false,
		};

		const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

		// Solid material with metallic look
		const material = new THREE.MeshPhongMaterial({
			color: 0xb8b8b8,
			specular: 0x444444,
			shininess: 30,
			side: THREE.DoubleSide,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = baseZ;
		group.add(mesh);

		// Outline edges from shape and holes (batched into single geometry)
		const edgeVerts: number[] = [];
		const addOutlineAtZ = (z: number) => {
			const outlinePoints = shape.getPoints(64);
			for (let i = 0; i < outlinePoints.length; i++) {
				const a = outlinePoints[i];
				const b = outlinePoints[(i + 1) % outlinePoints.length];
				edgeVerts.push(a.x, a.y, z, b.x, b.y, z);
			}
			for (const hole of shape.holes) {
				const holePoints = hole.getPoints(64);
				for (let i = 0; i < holePoints.length; i++) {
					const a = holePoints[i];
					const b = holePoints[(i + 1) % holePoints.length];
					edgeVerts.push(a.x, a.y, z, b.x, b.y, z);
				}
			}
		};
		addOutlineAtZ(baseZ);
		addOutlineAtZ(baseZ + thickness!);
		if (edgeVerts.length > 0) {
			const edgeGeo = new THREE.BufferGeometry();
			edgeGeo.setAttribute(
				'position',
				new THREE.Float32BufferAttribute(edgeVerts, 3),
			);
			const edgeMaterial = new THREE.LineBasicMaterial({
				color: color || 0x333333,
			});
			const edgeLines = new THREE.LineSegments(edgeGeo, edgeMaterial);
			edgeLines.position.z = 0;
			group.add(edgeLines);
		}

		return group;
	};

	// Create lines at both z=0 and z=thickness with vertical connections
	const createThickLines = (
		points: THREE.Vector3[],
		color: number,
	): THREE.Group => {
		const group = new THREE.Group();
		// Bottom edge
		group.add(createLine2FromPoints(points, color));
		// Top edge
		const topPoints = points.map(
			(p) => new THREE.Vector3(p.x, p.y, p.z + thickness!),
		);
		group.add(createLine2FromPoints(topPoints, color));
		// Vertical edges at start and end
		group.add(createLine2FromPoints([points[0], topPoints[0]], color));
		group.add(
			createLine2FromPoints(
				[points[points.length - 1], topPoints[topPoints.length - 1]],
				color,
			),
		);
		return group;
	};

	const hasThickness = thickness !== undefined && thickness > 0;

	// Extract start/end endpoints from a LINE or ARC entity for path assembly
	const getSegmentEndpoints = (
		entity: any,
	): {
		start: { x: number; y: number };
		end: { x: number; y: number };
	} | null => {
		switch (entity.type) {
			case 'LINE': {
				if (!entity.vertices || entity.vertices.length < 2) return null;
				return {
					start: { x: entity.vertices[0].x, y: entity.vertices[0].y },
					end: { x: entity.vertices[1].x, y: entity.vertices[1].y },
				};
			}
			case 'ARC': {
				if (!entity.center || !entity.radius) return null;
				const cx = entity.center.x;
				const cy = entity.center.y;
				const r = entity.radius;
				const sa = entity.startAngle;
				const ea = entity.endAngle;
				return {
					start: {
						x: cx + r * Math.cos(sa),
						y: cy + r * Math.sin(sa),
					},
					end: { x: cx + r * Math.cos(ea), y: cy + r * Math.sin(ea) },
				};
			}
			case 'SPLINE': {
				if (!entity.controlPoints || entity.controlPoints.length < 2)
					return null;
				if (entity.closed) return null; // Closed splines handled separately
				if (
					entity.knotValues &&
					entity.knotValues.length > 0 &&
					entity.degreeOfSplineCurve
				) {
					const cp = entity.controlPoints.map((p: any) => ({
						x: p.x,
						y: p.y,
						z: p.z || 0,
					}));
					const startPt = getBSplineStartPoint(
						entity.degreeOfSplineCurve,
						cp,
						entity.knotValues,
					);
					const endPt = getBSplineEndPoint(
						entity.degreeOfSplineCurve,
						cp,
						entity.knotValues,
					);
					return {
						start: { x: startPt.x, y: startPt.y },
						end: { x: endPt.x, y: endPt.y },
					};
				}
				// Fallback to first/last control points
				const first = entity.controlPoints[0];
				const last =
					entity.controlPoints[entity.controlPoints.length - 1];
				return {
					start: { x: first.x, y: first.y },
					end: { x: last.x, y: last.y },
				};
			}
			case 'LWPOLYLINE':
			case 'POLYLINE': {
				if (!entity.vertices || entity.vertices.length < 2) return null;
				if (entity.shape) return null; // Closed polylines handled separately
				const firstV = entity.vertices[0];
				const lastV = entity.vertices[entity.vertices.length - 1];
				return {
					start: { x: firstV.x, y: firstV.y },
					end: { x: lastV.x, y: lastV.y },
				};
			}
			default:
				return null;
		}
	};

	// Generate intermediate points along an ARC for use in Shape/Path
	const getArcPoints = (
		entity: any,
		reverse: boolean,
	): { x: number; y: number }[] => {
		const cx = entity.center.x;
		const cy = entity.center.y;
		const r = entity.radius;
		const sa = entity.startAngle;
		const ea = entity.endAngle;
		let sweep = ea - sa;
		if (sweep <= 0) sweep += 2 * Math.PI;

		const segments = Math.max(16, Math.ceil((sweep / Math.PI) * 16));
		const points: { x: number; y: number }[] = [];

		if (reverse) {
			// Go from endAngle back to startAngle
			for (let i = segments - 1; i >= 0; i--) {
				const t = i / segments;
				const angle = sa + t * sweep;
				points.push({
					x: cx + r * Math.cos(angle),
					y: cy + r * Math.sin(angle),
				});
			}
		} else {
			// Go from startAngle to endAngle (skip first point, it's the segment start)
			for (let i = 1; i <= segments; i++) {
				const t = i / segments;
				const angle = sa + t * sweep;
				points.push({
					x: cx + r * Math.cos(angle),
					y: cy + r * Math.sin(angle),
				});
			}
		}
		return points;
	};

	// Generate intermediate points along a SPLINE for use in Shape/Path
	const getSplinePoints = (
		entity: any,
		reverse: boolean,
	): { x: number; y: number }[] => {
		let pts: { x: number; y: number }[];
		if (
			entity.knotValues &&
			entity.knotValues.length > 0 &&
			entity.degreeOfSplineCurve
		) {
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
			pts = evaluated.map((p) => ({ x: p.x, y: p.y }));
		} else {
			pts = entity.controlPoints.map((p: any) => ({ x: p.x, y: p.y }));
		}
		if (reverse) {
			pts = pts.slice().reverse();
			// Skip first point (it's the segment start, already added)
			return pts.slice(1);
		}
		// Skip first point (it's the segment start, already added)
		return pts.slice(1);
	};

	// Assemble open LINE/ARC segments into closed paths by chaining endpoints
	const assembleClosedPaths = (
		segments: {
			start: { x: number; y: number };
			end: { x: number; y: number };
			entity: any;
		}[],
	) => {
		const TOLERANCE = 0.5; // mm tolerance for endpoint matching
		const used = new Set<number>();
		const results: {
			shape: THREE.Shape;
			area: number;
			unusedSegments: any[];
		}[] = [];

		const dist = (
			a: { x: number; y: number },
			b: { x: number; y: number },
		) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

		// Try to build closed chains
		for (let startIdx = 0; startIdx < segments.length; startIdx++) {
			if (used.has(startIdx)) continue;

			const chain: { entity: any; reversed: boolean }[] = [];
			chain.push({ entity: segments[startIdx].entity, reversed: false });
			used.add(startIdx);

			const chainStart = segments[startIdx].start;
			let currentEnd = segments[startIdx].end;
			let closed = false;

			for (let iter = 0; iter < segments.length; iter++) {
				// Check if loop is closed
				if (
					chain.length > 1 &&
					dist(currentEnd, chainStart) < TOLERANCE
				) {
					closed = true;
					break;
				}

				// Find next matching segment
				let found = false;
				for (let i = 0; i < segments.length; i++) {
					if (used.has(i)) continue;

					// Try normal direction: segment.start matches currentEnd
					if (dist(segments[i].start, currentEnd) < TOLERANCE) {
						chain.push({
							entity: segments[i].entity,
							reversed: false,
						});
						used.add(i);
						currentEnd = segments[i].end;
						found = true;
						break;
					}

					// Try reversed: segment.end matches currentEnd
					if (dist(segments[i].end, currentEnd) < TOLERANCE) {
						chain.push({
							entity: segments[i].entity,
							reversed: true,
						});
						used.add(i);
						currentEnd = segments[i].start;
						found = true;
						break;
					}
				}

				if (!found) break;
			}

			if (closed && chain.length >= 2) {
				// Build Shape from the chain
				const shape = new THREE.Shape();
				shape.moveTo(chainStart.x, chainStart.y);

				for (const seg of chain) {
					const e = seg.entity;
					if (e.type === 'LINE') {
						const target = seg.reversed
							? { x: e.vertices[0].x, y: e.vertices[0].y }
							: { x: e.vertices[1].x, y: e.vertices[1].y };
						shape.lineTo(target.x, target.y);
					} else if (e.type === 'ARC') {
						const arcPts = getArcPoints(e, seg.reversed);
						for (const p of arcPts) {
							shape.lineTo(p.x, p.y);
						}
					} else if (e.type === 'SPLINE') {
						const splinePts = getSplinePoints(e, seg.reversed);
						for (const p of splinePts) {
							shape.lineTo(p.x, p.y);
						}
					} else if (
						e.type === 'LWPOLYLINE' ||
						e.type === 'POLYLINE'
					) {
						const verts = e.vertices as { x: number; y: number }[];
						const ordered = seg.reversed
							? [...verts].reverse()
							: verts;
						// Skip first point (it's the segment start, already in the shape)
						for (let vi = 1; vi < ordered.length; vi++) {
							shape.lineTo(ordered[vi].x, ordered[vi].y);
						}
					}
				}
				shape.closePath();

				// Compute area
				const pts = shape.getPoints(64);
				let area = 0;
				for (let i = 0; i < pts.length; i++) {
					const j = (i + 1) % pts.length;
					area += pts[i].x * pts[j].y;
					area -= pts[j].x * pts[i].y;
				}
				area = Math.abs(area) / 2;

				// Ensure CCW winding for the shape
				const isCW = THREE.ShapeUtils.isClockWise(pts);
				if (isCW) {
					const reversed = [...pts].reverse();
					const fixedShape = new THREE.Shape();
					fixedShape.moveTo(reversed[0].x, reversed[0].y);
					for (let k = 1; k < reversed.length; k++) {
						fixedShape.lineTo(reversed[k].x, reversed[k].y);
					}
					fixedShape.closePath();
					results.push({
						shape: fixedShape,
						area,
						unusedSegments: [],
					});
				} else {
					results.push({ shape, area, unusedSegments: [] });
				}
			} else {
				// Couldn't close the chain - release segments back
				chain.forEach((seg) => {
					// Find and unmark the segment
					for (let i = 0; i < segments.length; i++) {
						if (segments[i].entity === seg.entity && used.has(i)) {
							used.delete(i);
							break;
						}
					}
				});
			}
		}

		// Collect unused segments
		const unusedEntities: any[] = [];
		for (let i = 0; i < segments.length; i++) {
			if (!used.has(i)) {
				unusedEntities.push(segments[i].entity);
			}
		}

		// Attach unused to last result or create a standalone result
		if (results.length > 0) {
			results[results.length - 1].unusedSegments = unusedEntities;
		} else {
			results.push({
				shape: new THREE.Shape(),
				area: 0,
				unusedSegments: unusedEntities,
			});
		}

		return results;
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
				if (hasThickness) {
					return createThickLines(points, color);
				}
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
				if (hasThickness) {
					return createThickLines(points, color);
				}
				return createLine2FromPoints(points, color);
			}

			case 'CIRCLE': {
				const cz = entity.center.z || 0;
				const segments = 64;
				const points: THREE.Vector3[] = [];
				for (let i = 0; i <= segments; i++) {
					const theta = (i / segments) * Math.PI * 2;
					points.push(
						new THREE.Vector3(
							entity.center.x + entity.radius * Math.cos(theta),
							entity.center.y + entity.radius * Math.sin(theta),
							cz,
						),
					);
				}
				if (hasThickness) {
					return createThickLines(points, color);
				}
				return createLine2FromPoints(points, color);
			}

			case 'ARC': {
				const cx = entity.center.x;
				const cy = entity.center.y;
				const cz = entity.center.z || 0;
				const r = entity.radius;

				const startAngle = entity.startAngle;
				const endAngle = entity.endAngle;

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
				if (hasThickness) {
					return createThickLines(points, color);
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
				if (hasThickness) {
					return createThickLines(points, color);
				}
				return createLine2FromPoints(points, color);
			}

			case 'SPLINE': {
				if (!entity.controlPoints || entity.controlPoints.length < 2)
					return null;
				let points: THREE.Vector3[];
				if (
					entity.knotValues &&
					entity.knotValues.length > 0 &&
					entity.degreeOfSplineCurve
				) {
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
					points = evaluated.map(
						(p) => new THREE.Vector3(p.x, p.y, p.z),
					);
				} else if (entity.fitPoints && entity.fitPoints.length >= 2) {
					const fitPts = entity.fitPoints.map(
						(p: any) => new THREE.Vector3(p.x, p.y, p.z || 0),
					);
					const curve = new THREE.CatmullRomCurve3(fitPts);
					points = curve.getPoints(entity.fitPoints.length * 10);
				} else {
					points = entity.controlPoints.map(
						(p: any) => new THREE.Vector3(p.x, p.y, p.z || 0),
					);
				}
				if (hasThickness) {
					return createThickLines(points, color);
				}
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
			cameraRef.current.position.set(0, -100, 100);
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
					{dimensions.depth > 0.01 && (
						<span className='px-2 py-0.5 bg-blue-100 text-blue-700 rounded'>
							D: {dimensions.depth.toFixed(2)} mm
						</span>
					)}
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
						<li>Left click + drag: Rotate</li>
						<li>Right click + drag: Pan</li>
						<li>Mouse wheel: Zoom</li>
					</ul>
				</div>
			)}
		</div>
	);
}
