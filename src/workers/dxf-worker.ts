/**
 * DXF Parser Web Worker
 * Offloads DXF parsing and validation to prevent main thread blocking
 */

import DxfParser from 'dxf-parser';
import { validateDXF } from '@/lib/dxf-validation';
import { computeTotalPiercings, computeTotalCutLength, computeDXFBoundingBox, validateDXFGeometry } from '@/lib/dxf-area';
import type {
	WorkerRequest,
	ParseDxfSuccess,
	ParseDxfError,
} from '@/lib/dxf-worker-types';

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const { type, payload } = event.data;

	if (type === 'PARSE_DXF') {
		const { dxfString, requestId } = payload;

		try {
			// Parse DXF in worker thread
			const parser = new DxfParser();
			const parsed = parser.parseSync(dxfString);

			if (!parsed) {
				const errorResponse: ParseDxfError = {
					type: 'PARSE_DXF_ERROR',
					payload: {
						requestId,
						error: 'Failed to parse DXF file',
					},
				};
				self.postMessage(errorResponse);
				return;
			}

			// Validate parsed DXF (structural)
			const validation = validateDXF(parsed);

			// Run geometric validations (hole sizes, floating pieces)
			const geometricValidation = validateDXFGeometry(
				parsed.entities || [],
				parsed.blocks
			);

			// Merge geometric errors into structural validation result
			if (geometricValidation.errors.length > 0) {
				validation.errors.push(...geometricValidation.errors);
				validation.isValid = false;
			}

			// Compute piercings breakdown (single closed entities + assembled paths)
			const piercings = computeTotalPiercings(
				parsed.entities || [],
				parsed.blocks
			);

			// Compute total cut length (sum of all path segments)
			const cutLength = computeTotalCutLength(
				parsed.entities || [],
				parsed.blocks
			);

			// Compute bounding box
			const boundingBox = computeDXFBoundingBox(
				parsed.entities || [],
				parsed.blocks
			);

			// Send success response back to main thread
			const successResponse: ParseDxfSuccess = {
				type: 'PARSE_DXF_SUCCESS',
				payload: {
					requestId,
					parsed,
					validation,
					piercings,
					cutLength,
					boundingBox,
				},
			};
			self.postMessage(successResponse);
		} catch (err) {
			// Send error response back to main thread
			const errorResponse: ParseDxfError = {
				type: 'PARSE_DXF_ERROR',
				payload: {
					requestId,
					error:
						err instanceof Error
							? err.message
							: 'Unknown error during DXF parsing',
				},
			};
			self.postMessage(errorResponse);
		}
	}
};

// Export empty object to make TypeScript happy
export {};
