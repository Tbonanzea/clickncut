'use client';

import { useState, useEffect } from 'react';
import { Input } from './input';

/** Format a raw numeric string to Argentine locale display (dot = thousands, comma = decimal) */
function toDisplay(raw: string): string {
	if (!raw && raw !== '0') return '';
	const num = parseFloat(raw);
	if (isNaN(num)) return raw;
	return num.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/** Convert a formatted display string back to raw numeric string (standard decimal notation) */
function toRaw(display: string): string {
	return display.replace(/\./g, '').replace(',', '.');
}

interface PriceInputProps
	extends Omit<
		React.ComponentProps<typeof Input>,
		'type' | 'onChange' | 'value' | 'defaultValue'
	> {
	/** Controlled raw numeric string (e.g. "20000" or "1500.5") */
	value?: string;
	/** Initial value for uncontrolled usage */
	defaultValue?: string | number;
	/** Called with raw numeric string on change */
	onValueChange?: (raw: string) => void;
}

export function PriceInput({
	value: controlledValue,
	defaultValue,
	onValueChange,
	onFocus,
	onBlur,
	...props
}: PriceInputProps) {
	const initial =
		controlledValue !== undefined
			? controlledValue
			: defaultValue !== undefined
				? String(defaultValue)
				: '';

	const [raw, setRaw] = useState(initial);
	const [display, setDisplay] = useState(() => toDisplay(initial));
	const [focused, setFocused] = useState(false);

	// Sync with controlled value changes
	useEffect(() => {
		if (controlledValue !== undefined && !focused) {
			setRaw(controlledValue);
			setDisplay(toDisplay(controlledValue));
		}
	}, [controlledValue, focused]);

	return (
		<Input
			{...props}
			type='text'
			inputMode='decimal'
			value={display}
			onChange={(e) => {
				const input = e.target.value;
				setDisplay(input);
				const r = toRaw(input);
				setRaw(r);
				onValueChange?.(r);
			}}
			onFocus={(e) => {
				setFocused(true);
				onFocus?.(e);
			}}
			onBlur={(e) => {
				setFocused(false);
				setDisplay(toDisplay(raw));
				onBlur?.(e);
			}}
		/>
	);
}
