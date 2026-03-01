'use client';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuoting } from '@/context/quotingContext';
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	File as LucideFile,
	UploadCloud,
	X,
} from 'lucide-react';
import { useCallback, useState, useRef } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useDxfWorker } from '@/hooks/useDxfWorker';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

function isDXF(file: File) {
	return (
		file.type === 'application/dxf' ||
		file.name.toLowerCase().endsWith('.dxf')
	);
}

function FileUploader() {
	const {
		cart,
		addItem,
		removeItem,
		markStep,
	} = useQuoting();

	// Initialize DXF Worker
	const { parseDxf, isReady: workerReady } = useDxfWorker();

	// Track blob URLs for cleanup
	const blobUrlsRef = useRef<Set<string>>(new Set());

	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [isUploading, setIsUploading] = useState(false);

	const onDropAccepted = useCallback(
		async (acceptedFiles: File[]) => {
			// Limit new files to remaining capacity
			const remainingSlots = MAX_FILES - cart.items.length;

			if (remainingSlots <= 0) {
				toast.error(`Ya tenés ${MAX_FILES} archivos cargados. Eliminá alguno para agregar más.`);
				return;
			}

			setIsUploading(true);
			setUploadProgress(0);

			const filesToProcess = acceptedFiles.slice(0, remainingSlots);

			const newErrors: { fileName: string; error: string }[] = [];
			let validFilesCount = cart.items.filter(
				(item) => item.file._validationStatus === 'valid'
			).length;

			if (acceptedFiles.length > remainingSlots) {
				newErrors.push({
					fileName: '',
					error: `Solo se pueden subir ${MAX_FILES} archivos en total. Se ignoraron ${acceptedFiles.length - remainingSlots} archivo(s).`,
				});
			}

			let processed = 0;
			for (const file of filesToProcess) {
				// Valida tipo/mime y extensión
				if (!isDXF(file)) {
					newErrors.push({
						fileName: file.name,
						error: 'Solo archivos .dxf permitidos.',
					});
					processed++;
					setUploadProgress(
						Math.round((processed / filesToProcess.length) * 100)
					);
					continue;
				}

				// Generate blob URL for preview
				const blobUrl = URL.createObjectURL(file);
				blobUrlsRef.current.add(blobUrl); // Track for cleanup

				// Read file contents
				const text = await file.text();

				// Parse and validate DXF file in Web Worker
				try {
					const { parsed, validation, piercings, cutLength, boundingBox } = await parseDxf(text);

					setUploadProgress(
						Math.round(((processed + 1) / filesToProcess.length) * 100)
					);

					if (!validation.isValid) {
						// File failed DXF validation
						newErrors.push({
							fileName: file.name,
							error: `Archivo DXF inválido: ${validation.errors.join(', ')}`,
						});

						// Add to cart but mark as invalid (don't cache parsed data for invalid files)
						const quotingFile = {
							id: crypto.randomUUID(),
							filename: file.name,
							filepath: '',
							filetype: 'DXF' as const,
							_rawFile: file,
							_blobUrl: blobUrl,
							_validationStatus: 'invalid' as const,
							_validationErrors: validation.errors,
						};
						addItem({
							file: quotingFile,
							material: null,
							materialType: null,
							quantity: 1,
							price: 0,
						});
					} else {
						// File passed validation - cache parsed DXF and piercings
						validFilesCount++;
						const quotingFile = {
							id: crypto.randomUUID(),
							filename: file.name,
							filepath: '',
							filetype: 'DXF' as const,
							_rawFile: file,
							_blobUrl: blobUrl,
							_validationStatus: 'valid' as const,
							_validationErrors: [],
							_parsedDxf: parsed,
							_piercings: piercings,
							_cutLength: cutLength,
							_boundingBox: boundingBox,
						};
						addItem({
							file: quotingFile,
							material: null,
							materialType: null,
							quantity: 1,
							price: 0,
						});
					}
				} catch (err) {
					// Worker parsing failed
					newErrors.push({
						fileName: file.name,
						error: `Error al procesar archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`,
					});

					// Add to cart but mark as invalid
					const quotingFile = {
						id: crypto.randomUUID(),
						filename: file.name,
						filepath: '',
						filetype: 'DXF' as const,
						_rawFile: file,
						_blobUrl: blobUrl,
						_validationStatus: 'invalid' as const,
						_validationErrors: [err instanceof Error ? err.message : 'Error desconocido'],
					};
					addItem({
						file: quotingFile,
						material: null,
						materialType: null,
						quantity: 1,
						price: 0,
					});
				}

				processed++;
			}

			setIsUploading(false);

			// Mark step as complete only if ALL files are valid (no invalid files)
			const totalItems = cart.items.length + filesToProcess.length;
			const invalidCount = newErrors.filter(e => e.fileName).length;
			markStep('file-upload', validFilesCount > 0 && invalidCount === 0 && validFilesCount === totalItems);
		},
		[addItem, cart.items, markStep, parseDxf]
	);

	const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
		for (const rejection of fileRejections) {
			for (const error of rejection.errors) {
				toast.error(`${rejection.file.name}: ${error.message}`);
			}
		}
	}, []);

	const remainingSlots = MAX_FILES - cart.items.length;

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: {
			'application/dxf': ['.dxf'],
		},
		maxSize: MAX_FILE_SIZE,
		multiple: true,
		maxFiles: Math.max(remainingSlots, 1),
		onDropAccepted,
		onDropRejected,
		validator: (file) =>
			isDXF(file)
				? null
				: {
						code: 'invalid-type',
						message: 'Solo archivos .dxf permitidos.',
				  },
		disabled: isUploading || !workerReady,
	});

	const handleRemove = (index: number) => {
		// Cleanup blob URL before removing
		const item = cart.items[index];
		if (item?.file._blobUrl) {
			URL.revokeObjectURL(item.file._blobUrl);
			blobUrlsRef.current.delete(item.file._blobUrl);
		}
		removeItem(index);

		// Re-evaluate step validity after removal
		const remainingItems = cart.items.filter((_, i) => i !== index);
		const allValid = remainingItems.length > 0 && remainingItems.every(
			(item) => item.file._validationStatus === 'valid'
		);
		markStep('file-upload', allValid);
	};

	// Note: We intentionally don't cleanup blob URLs on unmount because
	// they're still needed in subsequent steps (material selection, review)
	// The URLs will be cleaned up when:
	// 1. Individual items are removed (handleRemove)
	// 2. New files are uploaded (onDropAccepted)
	// 3. The browser tab is closed (automatic cleanup)

	return (
		<Card className='w-full'>
			<CardHeader>
				<CardTitle>Subir archivos DXF</CardTitle>
				<CardDescription>
					Arrastra tus archivos DXF aquí o haz clic para seleccionar
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					{...getRootProps()}
					className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
						isDragActive
							? 'border-primary bg-primary/10'
							: 'border-muted-foreground/30 hover:border-primary/50'
					} ${isUploading || !workerReady ? 'opacity-70 pointer-events-none' : ''}`}
				>
					<input {...getInputProps()} />
					<div className='flex flex-col items-center justify-center gap-4'>
						<UploadCloud className='h-12 w-12 text-muted-foreground' />
						<div>
							<p className='font-medium'>
								{!workerReady
									? 'Inicializando procesador de archivos...'
									: isDragActive
									? 'Suelta tu archivo aquí...'
									: 'Arrastra y suelta tu archivo DXF aquí'}
							</p>
							<p className='text-sm text-muted-foreground mt-1'>
								Formatos aceptados: .dxf (Máx. {MAX_FILES}{' '}
								archivos, {MAX_FILE_SIZE / 1024 / 1024}MB cada
								uno)
							</p>
						</div>
						<Button variant='outline' className='mt-2' disabled={!workerReady}>
							Seleccionar archivos
						</Button>
					</div>
				</div>

				{/* Estado de carga/progreso */}
				{isUploading && (
					<div className='mt-6 space-y-4'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium'>
								Subiendo archivos...
							</span>
							<span className='text-sm text-muted-foreground'>
								{uploadProgress}%
							</span>
						</div>
						<Progress value={uploadProgress} className='h-2' />
						<div className='flex justify-center'>
							<Loader2 className='h-6 w-6 animate-spin text-primary' />
						</div>
					</div>
				)}

				{/* Archivos aceptados / subidos (cart.items) */}
				{cart.items.length > 0 && (
					<div className='mt-6'>
						<h4 className='font-medium mb-3'>
							Archivos seleccionados:
						</h4>
						<div className='space-y-2'>
							{cart.items.map((item, index) => {
								const isValid =
									item.file._validationStatus === 'valid';
								const isInvalid =
									item.file._validationStatus === 'invalid';

								return (
									<div
										key={`${item.file.id}-${index}`}
										className={`flex items-start p-3 border rounded-md ${
											isValid
												? 'bg-green-50 border-green-200'
												: isInvalid
												? 'bg-red-50 border-red-200'
												: 'bg-muted/50'
										}`}
									>
										{isValid ? (
											<CheckCircle2 className='h-5 w-5 mr-3 text-success flex-shrink-0 mt-0.5' />
										) : isInvalid ? (
											<AlertCircle className='h-5 w-5 mr-3 text-destructive flex-shrink-0 mt-0.5' />
										) : (
											<LucideFile className='h-5 w-5 mr-3 text-blue-500 flex-shrink-0 mt-0.5' />
										)}
										<div className='flex-1 min-w-0'>
											<p className='font-medium truncate'>
												{item.file.filename}
											</p>
											<p
												className={`text-xs ${
													isValid
														? 'text-green-700'
														: isInvalid
														? 'text-red-700'
														: 'text-muted-foreground'
												}`}
											>
												{isValid
													? 'Archivo válido'
													: isInvalid
													? 'Archivo inválido'
													: item.file.filetype}
											</p>
											{isInvalid &&
												item.file._validationErrors &&
												item.file._validationErrors
													.length > 0 && (
													<div className='mt-2 text-xs text-destructive'>
														<p className='font-medium'>
															Errores de validación:
														</p>
														<ul className='list-disc list-inside ml-2 mt-1'>
															{item.file._validationErrors
																.slice(0, 3)
																.map(
																	(
																		err,
																		errIdx
																	) => (
																		<li
																			key={
																				errIdx
																			}
																		>
																			{err}
																		</li>
																	)
																)}
															{item.file
																._validationErrors
																.length > 3 && (
																<li>
																	...y{' '}
																	{item.file
																		._validationErrors
																		.length -
																		3}{' '}
																	más
																</li>
															)}
														</ul>
													</div>
												)}
										</div>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8'
											onClick={(e) => {
												e.stopPropagation();
												handleRemove(index);
											}}
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Resumen de validación */}
				{cart.items.length > 0 && !isUploading && (() => {
					const validCount = cart.items.filter(
						(item) => item.file._validationStatus === 'valid'
					).length;
					const invalidCount = cart.items.filter(
						(item) => item.file._validationStatus === 'invalid'
					).length;

					return (
						<div className={`mt-6 flex items-center justify-between p-3 rounded-md border text-sm ${
							invalidCount > 0
								? 'bg-red-50 border-red-200'
								: 'bg-green-50 border-green-200'
						}`}>
							<div className='flex items-center gap-4'>
								{validCount > 0 && (
									<div className='flex items-center gap-1.5'>
										<CheckCircle2 className='h-4 w-4 text-green-600' />
										<span className='text-green-700'>{validCount} {validCount === 1 ? 'válido' : 'válidos'}</span>
									</div>
								)}
								{invalidCount > 0 && (
									<div className='flex items-center gap-1.5'>
										<AlertCircle className='h-4 w-4 text-red-600' />
										<span className='text-red-700'>{invalidCount} {invalidCount === 1 ? 'inválido' : 'inválidos'}</span>
									</div>
								)}
							</div>
							{invalidCount > 0 && (
								<span className='text-xs text-red-600 font-medium'>
									Eliminá los archivos inválidos para continuar
								</span>
							)}
						</div>
					);
				})()}
			</CardContent>
		</Card>
	);
}

export default FileUploader;
