export const getZeroAmountDisplay = () => "0.00";

export const formatTwoDecimalAmount = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toFixed(2)
    : getZeroAmountDisplay();
};