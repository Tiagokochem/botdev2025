class BinanceApiError extends Error {
  constructor(message, { code, status, payload } = {}) {
    super(message);
    this.name = "BinanceApiError";
    this.code = code;
    this.status = status;
    this.payload = payload;
  }
}

module.exports = { BinanceApiError };
