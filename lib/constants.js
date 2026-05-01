/**
 * Constantes compartilhadas do bot (espelham valores usados em index.js).
 */
module.exports = {
  SYMBOL: "BTCUSDT",
  RSI_PERIOD: 14,
  ATR_PERIOD: 14,
  FEE_RATE: 0.001,
  MIN_PROFIT_MARGIN: 0.0,
  TAKE_PROFIT_PERCENT: 0.15,
  RSI_OVERSOLD: 30,
  RSI_OVERBOUGHT: 70,
  KLINES_LIMIT: 100,
  KLINES_INTERVAL: "5m",
  KLINES_TIMEOUT_MS: 5000,
};
