/**
 * Format a number as an ARS price string with thousands separators.
 * Uses Argentine locale: dot for thousands, comma for decimals.
 *
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default 0)
 * @returns Formatted string like "$20.000" or "$1.500,50"
 */
export function formatPrice(value: number, decimals = 0): string {
	return (
		'$' +
		value.toLocaleString('es-AR', {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		})
	);
}

/**
 * Parse a formatted number string (Argentine locale) back to a number.
 * Strips dots (thousands) and replaces comma (decimal) with dot.
 *
 * @param formatted - String like "20.000" or "1.500,50"
 * @returns Parsed number
 */
export function parseFormattedNumber(formatted: string): number {
	return parseFloat(formatted.replace(/\./g, '').replace(',', '.'));
}
