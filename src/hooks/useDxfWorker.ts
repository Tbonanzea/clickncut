/**
 * React hook for managing DXF Worker
 * Provides a clean interface for parsing DXF files in a Web Worker
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
	ParsedDxfResult,
	WorkerRequest,
	WorkerResponse,
} from '@/lib/dxf-worker-types';

interface UseDxfWorkerReturn {
	parseDxf: (text: string) => Promise<ParsedDxfResult>;
	isReady: boolean;
	error: string | null;
}

export function useDxfWorker(): UseDxfWorkerReturn {
	const workerRef = useRef<Worker | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pendingRequestsRef = useRef<
		Map<
			string,
			{
				resolve: (result: ParsedDxfResult) => void;
				reject: (error: Error) => void;
			}
		>
	>(new Map());

	// Initialize worker on mount
	useEffect(() => {
		try {
			const worker = new Worker(
				new URL('../workers/dxf-worker.ts', import.meta.url),
				{ type: 'module' }
			);

			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const { type, payload } = event.data;

				if (type === 'PARSE_DXF_SUCCESS') {
					const { requestId, parsed, validation, piercings, cutLength, boundingBox, pieceAreaMm2 } = payload;
					const pending = pendingRequestsRef.current.get(requestId);
					if (pending) {
						pending.resolve({ parsed, validation, piercings, cutLength, boundingBox, pieceAreaMm2 });
						pendingRequestsRef.current.delete(requestId);
					}
				} else if (type === 'PARSE_DXF_ERROR') {
					const { requestId, error } = payload;
					const pending = pendingRequestsRef.current.get(requestId);
					if (pending) {
						pending.reject(new Error(error));
						pendingRequestsRef.current.delete(requestId);
					}
				}
			};

			worker.onerror = (err) => {
				console.error('Worker error:', err);
				setError('Worker initialization failed');
				setIsReady(false);
			};

			workerRef.current = worker;
			setIsReady(true);
			setError(null);
		} catch (err) {
			console.error('Failed to create worker:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to create worker'
			);
			setIsReady(false);
		}

		// Cleanup worker on unmount
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			// Reject all pending requests (capture ref value for cleanup)
			// eslint-disable-next-line react-hooks/exhaustive-deps
			const pendingRequests = pendingRequestsRef.current;
			pendingRequests.forEach((pending) => {
				pending.reject(new Error('Worker terminated'));
			});
			pendingRequests.clear();
		};
	}, []);

	const parseDxf = useCallback(
		async (text: string): Promise<ParsedDxfResult> => {
			if (!workerRef.current || !isReady) {
				throw new Error('Worker not ready');
			}

			return new Promise((resolve, reject) => {
				const requestId = crypto.randomUUID();

				// Store promise handlers
				pendingRequestsRef.current.set(requestId, { resolve, reject });

				// Send request to worker
				const request: WorkerRequest = {
					type: 'PARSE_DXF',
					payload: {
						dxfString: text,
						requestId,
					},
				};

				workerRef.current!.postMessage(request);

				// Timeout after 30 seconds
				setTimeout(() => {
					const pending = pendingRequestsRef.current.get(requestId);
					if (pending) {
						pending.reject(new Error('Worker timeout'));
						pendingRequestsRef.current.delete(requestId);
					}
				}, 30000);
			});
		},
		[isReady]
	);

	return {
		parseDxf,
		isReady,
		error,
	};
}
