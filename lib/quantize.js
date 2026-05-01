/**
 * Ajusta quantidade ao stepSize da Binance (floor por casas decimais do step).
 */
function quantizeQuantity(amount, stepSize) {
  const decimals = (stepSize.toString().split(".")[1] || "").length;
  return parseFloat(
    Math.floor(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
  );
}

module.exports = { quantizeQuantity };
