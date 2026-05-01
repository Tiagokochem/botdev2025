const axios = require("axios");

async function fetchKlines(apiUrl, apiKey, symbol, options = {}) {
  const { limit = 100, interval = "5m", timeout = 5000 } = options;
  return axios.get(
    `${apiUrl}/api/v3/klines?limit=${limit}&interval=${interval}&symbol=${symbol}`,
    {
      headers: { "X-MBX-APIKEY": apiKey },
      timeout,
    }
  );
}

async function fetchTickerPrice(apiUrl, symbol, options = {}) {
  const { timeout = 5000 } = options;
  return axios.get(`${apiUrl}/api/v3/ticker/price?symbol=${symbol}`, { timeout });
}

module.exports = { fetchKlines, fetchTickerPrice };
