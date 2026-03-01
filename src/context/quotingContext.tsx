'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useReducer,
} from 'react';

// --------- Tipos del frontend alineados al modelo de Prisma ---------
export interface QuotingFile {
	id: string;
	filename: string;
	filepath: string;
	filetype: 'DXF' | 'OTHER';
	_rawFile?: File; // Raw File object for deferred upload
	_blobUrl?: string; // Blob URL for preview before S3 upload
	_validationStatus?: 'pending' | 'valid' | 'invalid'; // DXF validation status
	_validationErrors?: string[]; // Validation error messages
	_parsedDxf?: any; // Cached parsed DXF object to avoid double-parsing
	_piercings?: { singleClosed: number; assembledPaths: number; total: number };
	_cutLength?: { totalMm: number }; // Total linear cut length in mm
	_boundingBox?: { widthMm: number; heightMm: number }; // Piece bounding box
	_pieceAreaMm2?: number; // Real piece area from contour chaining (mm²)
}

export interface QuotingMaterial {
	id: string;
	name: string;
	description?: string;
}

export interface QuotingMaterialType {
	id: string;
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
	finish?: string | null;
}

export interface QuotingCartItem {
	file: QuotingFile;
	material: QuotingMaterial | null;
	materialType: QuotingMaterialType | null;
	quantity: number;
	price: number;
}

export interface QuotingCart {
	id?: string;
	userId?: string;
	items: QuotingCartItem[];
	extras: string[]; // Array of extra service IDs
}

export interface QuotingStep {
	id: string;
	name: string;
	path: string;
	completed: boolean;
	required: boolean;
}

interface State {
	currentStep: number;
	steps: QuotingStep[];
	cart: QuotingCart;
	isLoading: boolean;
	errors: Record<string, string>;
}

type Action =
	| { type: 'SET_STEP'; payload: number }
	| { type: 'SET_CART'; payload: Partial<QuotingCart> }
	| { type: 'ADD_ITEM'; payload: QuotingCartItem }
	| {
			type: 'UPDATE_ITEM';
			payload: { index: number; item: Partial<QuotingCartItem> };
	  }
	| { type: 'REMOVE_ITEM'; payload: number }
	| { type: 'SET_EXTRAS'; payload: string[] }
	| { type: 'MARK_STEP'; payload: { stepId: string; completed: boolean } }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: { field: string; error: string } }
	| { type: 'CLEAR_ERROR'; payload: string }
	| { type: 'RESET' };

// Compute step validity dynamically from actual cart data
// instead of relying on cached `completed` flags
function computeStepValidity(
	stepId: string,
	items: QuotingCartItem[]
): boolean {
	switch (stepId) {
		case 'file-upload':
			return (
				items.length > 0 &&
				items.every(
					(item) =>
						item.file.filetype === 'DXF' &&
						item.file._validationStatus === 'valid'
				)
			);
		case 'material-selection':
			return (
				items.length > 0 &&
				items.every((item) => !!item.material && !!item.materialType)
			);
		case 'extras':
			return true;
		case 'review':
			return (
				items.length > 0 &&
				items.every(
					(item) =>
						!!item.file &&
						!!item.material &&
						!!item.materialType &&
						item.quantity > 0
				)
			);
		default:
			return true;
	}
}

const steps: QuotingStep[] = [
	{
		id: 'file-upload',
		name: 'Carga de archivos',
		path: '/quoting',
		completed: false,
		required: true,
	},
	{
		id: 'material-selection',
		name: 'Selección de material',
		path: '/quoting/material',
		completed: false,
		required: true,
	},
	{
		id: 'extras',
		name: 'Extras',
		path: '/quoting/extras',
		completed: false,
		required: false,
	},
	{
		id: 'review',
		name: 'Revisión',
		path: '/quoting/review',
		completed: false,
		required: true,
	},
];

const initialState: State = {
	currentStep: 0,
	steps: steps,
	cart: { items: [], extras: [] },
	isLoading: false,
	errors: {},
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'SET_STEP':
			return { ...state, currentStep: action.payload };

		case 'SET_CART':
			return { ...state, cart: { ...state.cart, ...action.payload } };

		case 'ADD_ITEM':
			return {
				...state,
				cart: {
					...state.cart,
					items: [...state.cart.items, action.payload],
				},
			};

		case 'UPDATE_ITEM':
			const updatedItems = state.cart.items.map((item, i) =>
				i === action.payload.index
					? { ...item, ...action.payload.item }
					: item
			);
			return { ...state, cart: { ...state.cart, items: updatedItems } };

		case 'REMOVE_ITEM':
			return {
				...state,
				cart: {
					...state.cart,
					items: state.cart.items.filter(
						(_, i) => i !== action.payload
					),
				},
			};

		case 'SET_EXTRAS':
			return {
				...state,
				cart: {
					...state.cart,
					extras: action.payload,
				},
			};

		case 'MARK_STEP':
			return {
				...state,
				steps: state.steps.map((step) =>
					step.id === action.payload.stepId
						? { ...step, completed: action.payload.completed }
						: step
				),
			};

		case 'SET_LOADING':
			return { ...state, isLoading: action.payload };

		case 'SET_ERROR':
			return {
				...state,
				errors: {
					...state.errors,
					[action.payload.field]: action.payload.error,
				},
			};

		case 'CLEAR_ERROR':
			const { [action.payload]: _, ...rest } = state.errors;
			return { ...state, errors: rest };

		case 'RESET':
			return initialState;

		default:
			return state;
	}
}

interface QuotingContextType extends State {
	setStep: (n: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (id: string) => void;
	setCart: (cart: Partial<QuotingCart>) => void;
	addItem: (item: QuotingCartItem) => void;
	updateItem: (index: number, item: Partial<QuotingCartItem>) => void;
	removeItem: (index: number) => void;
	clearCart: () => void;
	setExtras: (extras: string[]) => void;
	markStep: (id: string, completed?: boolean) => void;
	setLoading: (v: boolean) => void;
	setError: (field: string, error: string) => void;
	clearError: (field: string) => void;
	reset: () => void;
	canProceed: (toStep: number) => boolean;
	validateCurrentStep: () => boolean;
}

const QuotingContext = createContext<QuotingContextType | null>(null);

export function QuotingProvider({ children }: { children: ReactNode }) {
	const value = useQuotingInternal();
	return (
		<QuotingContext.Provider value={value}>
			{children}
		</QuotingContext.Provider>
	);
}

function useQuotingInternal(): QuotingContextType {
	const [state, dispatch] = useReducer(reducer, initialState);
	const router = useRouter();
	const pathname = usePathname();

	// Sync current step with URL + guard against invalid navigation
	useEffect(() => {
		const idx = state.steps.findIndex((s) => s.path === pathname);
		if (idx === -1) return;

		// Guard: redirect to the first failing prerequisite step
		if (idx > 0) {
			for (let i = 0; i < idx; i++) {
				if (
					state.steps[i].required &&
					!computeStepValidity(state.steps[i].id, state.cart.items)
				) {
					router.replace(state.steps[i].path);
					return;
				}
			}
		}

		if (idx !== state.currentStep) {
			dispatch({ type: 'SET_STEP', payload: idx });
		}
	}, [pathname, state.steps, state.currentStep, state.cart.items, router]);

	// When cart items change, invalidate completed steps that:
	// 1. Have data that is no longer valid, OR
	// 2. Come AFTER the current step (user changed data here,
	//    so future steps need re-confirmation with the new data).
	useEffect(() => {
		state.steps.forEach((step, index) => {
			if (!step.completed) return;
			const valid = computeStepValidity(step.id, state.cart.items);
			if (!valid || index > state.currentStep) {
				dispatch({
					type: 'MARK_STEP',
					payload: { stepId: step.id, completed: false },
				});
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.cart.items]);

	const setStep = (n: number) => dispatch({ type: 'SET_STEP', payload: n });

	const nextStep = () => {
		const n = state.currentStep + 1;
		if (n < state.steps.length && canProceed(n)) {
			// Mark current step as complete before leaving
			validateCurrentStep();
			router.push(state.steps[n].path);
		}
	};

	const prevStep = () => {
		const n = state.currentStep - 1;
		if (n >= 0) router.push(state.steps[n].path);
	};

	const goToStep = (id: string) => {
		const idx = state.steps.findIndex((s) => s.id === id);
		if (idx === -1) return;
		// Allow backward navigation; guard forward navigation
		if (idx > state.currentStep && !canProceed(idx)) return;
		if (idx > state.currentStep) {
			// Mark current step as complete before leaving
			validateCurrentStep();
			// Mark any skipped intermediate steps
			for (let i = state.currentStep + 1; i < idx; i++) {
				const valid = computeStepValidity(
					state.steps[i].id,
					state.cart.items
				);
				markStep(state.steps[i].id, valid);
			}
		}
		router.push(state.steps[idx].path);
	};

	const setCart = (cart: Partial<QuotingCart>) =>
		dispatch({ type: 'SET_CART', payload: cart });

	const addItem = (item: QuotingCartItem) =>
		dispatch({ type: 'ADD_ITEM', payload: item });

	const updateItem = (index: number, item: Partial<QuotingCartItem>) =>
		dispatch({ type: 'UPDATE_ITEM', payload: { index, item } });

	const removeItem = (index: number) =>
		dispatch({ type: 'REMOVE_ITEM', payload: index });

	const clearCart = () =>
		dispatch({ type: 'SET_CART', payload: { items: [], extras: [] } });

	const setExtras = (extras: string[]) =>
		dispatch({ type: 'SET_EXTRAS', payload: extras });

	const markStep = (id: string, completed = true) =>
		dispatch({ type: 'MARK_STEP', payload: { stepId: id, completed } });

	const setLoading = (v: boolean) =>
		dispatch({ type: 'SET_LOADING', payload: v });

	const setError = (field: string, error: string) =>
		dispatch({ type: 'SET_ERROR', payload: { field, error } });

	const clearError = (field: string) =>
		dispatch({ type: 'CLEAR_ERROR', payload: field });

	const reset = () => {
		dispatch({ type: 'RESET' });
		router.push('/quoting');
	};

	const canProceed = (toStep: number): boolean => {
		for (let i = 0; i < toStep; i++) {
			if (
				state.steps[i].required &&
				!computeStepValidity(state.steps[i].id, state.cart.items)
			)
				return false;
		}
		return true;
	};

	const validateCurrentStep = (): boolean => {
		const step = state.steps[state.currentStep];
		let isValid = true;
		switch (step.id) {
			case 'file-upload':
				isValid =
					state.cart.items.length > 0 &&
					state.cart.items.every(
						(item) =>
							item.file.filetype === 'DXF' &&
							item.file._validationStatus === 'valid'
					);
				break;
			case 'material-selection':
				isValid =
					state.cart.items.length > 0 &&
					state.cart.items.every(
						(item) => !!item.material && !!item.materialType
					);
				break;
			case 'review':
				isValid =
					state.cart.items.length > 0 &&
					state.cart.items.every(
						(item) =>
							!!item.file &&
							!!item.material &&
							!!item.materialType &&
							item.quantity > 0
					);
				break;
			default:
				isValid = true;
		}
		markStep(step.id, isValid);
		return isValid;
	};

	return {
		...state,
		setStep,
		nextStep,
		prevStep,
		goToStep,
		setCart,
		addItem,
		updateItem,
		removeItem,
		clearCart,
		setExtras,
		markStep,
		setLoading,
		setError,
		clearError,
		reset,
		canProceed,
		validateCurrentStep,
	};
}

export function useQuoting() {
	const context = useContext(QuotingContext);
	if (!context)
		throw new Error('useQuoting debe usarse dentro de QuotingProvider');
	return context;
}

export function useCurrentStep() {
	const { currentStep, steps } = useQuoting();
	return {
		current: steps[currentStep],
		isFirst: currentStep === 0,
		isLast: currentStep === steps.length - 1,
		progress: ((currentStep + 1) / steps.length) * 100,
	};
}
