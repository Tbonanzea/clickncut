/**
 * Shared types for DXF Worker communication
 * Used by both main thread and Web Worker
 */

import { DXFValidationResult } from './dxf-validation';

export interface ParseDxfRequest {
	type: 'PARSE_DXF';
	payload: {
		dxfString: string;
		requestId: string;
	};
}

export interface PiercingsBreakdown {
	singleClosed: number;
	assembledPaths: number;
	total: number;
}

export interface CutLengthResult {
	totalMm: number;
}

export interface BoundingBoxResult {
	widthMm: number;
	heightMm: number;
}

export interface ParseDxfSuccess {
	type: 'PARSE_DXF_SUCCESS';
	payload: {
		requestId: string;
		parsed: any; // Parsed DXF object from dxf-parser
		validation: DXFValidationResult;
		piercings: PiercingsBreakdown;
		cutLength: CutLengthResult;
		boundingBox: BoundingBoxResult;
	};
}

export interface ParseDxfError {
	type: 'PARSE_DXF_ERROR';
	payload: {
		requestId: string;
		error: string;
	};
}

export type WorkerRequest = ParseDxfRequest;
export type WorkerResponse = ParseDxfSuccess | ParseDxfError;

export interface ParsedDxfResult {
	parsed: any;
	validation: DXFValidationResult;
	piercings: PiercingsBreakdown;
	cutLength: CutLengthResult;
	boundingBox: BoundingBoxResult;
}
