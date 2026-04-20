export const getZeroAmountDisplay = (): string => "0.00";

export const formatAmountDisplay = (value: number | string): string => {
	const numericValue = Number(value);
	return Number.isFinite(numericValue)
		? numericValue.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
		: getZeroAmountDisplay();
};