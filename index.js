const { API_URL, API_KEY } = require("./config");
const { RSI, ATR, calculateBollingerBands, calculateMACD } = require("./utils");
const { getBalance } = require("./trade");
const { fetchKlines, fetchTickerPrice } = require("./lib/marketData");
const { loadState, saveState } = require("./lib/stateStore");
const { placeOrder } = require("./lib/placeOrder");
const constants = require("./lib/constants");

const SYMBOL = constants.SYMBOL;
const PERIOD = constants.RSI_PERIOD;
const TOTAL_FEE = constants.FEE_RATE * 2;
const MIN_PROFIT_MARGIN = constants.MIN_PROFIT_MARGIN;
const TAKE_PROFIT_PERCENT = constants.TAKE_PROFIT_PERCENT;

let state = loadState();
let isOpened = state.isOpened;
let buyPrice = state.buyPrice;

async function initializeBot() {
  try {
    const btcBalance = await getBalance("BTC");

    if (btcBalance >= 0.00001) {
      isOpened = true;
      const { data: ticker } = await fetchTickerPrice(API_URL, SYMBOL);
      buyPrice = parseFloat(ticker.price);
    } else {
      isOpened = false;
      buyPrice = 0;
    }
    saveState({ isOpened, buyPrice });
  } catch (error) {
    console.error("Erro ao inicializar o bot:", error.message);
  }
}

async function start() {
  try {
    const response = await fetchKlines(API_URL, API_KEY, SYMBOL, {
      limit: constants.KLINES_LIMIT,
      interval: constants.KLINES_INTERVAL,
      timeout: constants.KLINES_TIMEOUT_MS,
    });

    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.error("Erro: Resposta da Binance veio vazia ou inválida.");
      return;
    }

    const data = response.data;
    if (data.length < 20) {
      console.error(`Erro: Dados insuficientes (${data.length} candles).`);
      return;
    }

    const lastCandle = data[data.length - 1];
    if (!lastCandle || !Array.isArray(lastCandle) || lastCandle.length < 5) {
      console.error("Erro: Último candle mal formatado.");
      return;
    }

    const lastPrice = parseFloat(lastCandle[4]);

    const closes = data.map(k => parseFloat(k[4])).filter(v => !isNaN(v));
    const highs = data.map(k => parseFloat(k[2])).filter(v => !isNaN(v));
    const lows = data.map(k => parseFloat(k[3])).filter(v => !isNaN(v));

    const minCount = Math.min(closes.length, highs.length, lows.length);
    if (minCount < 20) {
      console.error("Erro: Arrays de candles incompletos (<20).");
      return;
    }

    const rsi = RSI(closes, PERIOD);
    const atr = ATR(highs, lows, closes, constants.ATR_PERIOD);
    const bollinger = calculateBollingerBands(closes);
    const macd = calculateMACD(closes);

    if (
      isNaN(rsi) ||
      isNaN(atr) ||
      bollinger.upper === null || bollinger.lower === null ||
      isNaN(bollinger.upper) || isNaN(bollinger.lower) ||
      isNaN(macd.line) || isNaN(macd.signal)
    ) {
      console.error("Erro: Indicadores retornaram valores inválidos.");
      return;
    }

    console.log(`RSI: ${rsi.toFixed(2)}`);
    console.log(`ATR: ${atr.toFixed(2)}`);
    console.log(`Bollinger: Up=${bollinger.upper.toFixed(2)}, Low=${bollinger.lower.toFixed(2)}`);
    console.log(`MACD: Line=${macd.line.toFixed(2)}, Signal=${macd.signal.toFixed(2)}`);
    console.log(`Já comprei? ${isOpened}, Preço atual: ${lastPrice}`);

    if (rsi < constants.RSI_OVERSOLD && !isOpened) {
      console.log("RSI abaixo de 30 => compra");
      const orderSuccess = await placeOrder(SYMBOL, "BUY", lastPrice);
      if (orderSuccess) {
        isOpened = true;
        buyPrice = lastPrice;
        saveState({ isOpened, buyPrice });
        console.log("Compra realizada com sucesso!");
      } else {
        console.log("Compra falhou. Tentará novamente na próxima verificação.");
      }
    } else if (isOpened) {
      const profit = ((lastPrice - buyPrice) / buyPrice) - TOTAL_FEE;
      console.log(`Lucro estimado: ${(profit * 100).toFixed(2)}%`);

      if (profit < MIN_PROFIT_MARGIN) {
        console.log("Lucro negativo ou abaixo do mínimo. Mantendo posição para não ter prejuízo.");
        return;
      }

      const rsiHigh = rsi > constants.RSI_OVERBOUGHT;
      const priceHighEnough = lastPrice >= buyPrice * (1 + TAKE_PROFIT_PERCENT);

      if (rsiHigh || priceHighEnough) {
        console.log("Condições de venda atendidas (RSI alto ou take profit).");
        const sellSuccess = await placeOrder(SYMBOL, "SELL", lastPrice);
        if (sellSuccess) {
          isOpened = false;
          buyPrice = 0;
          saveState({ isOpened, buyPrice });
          console.log("Venda realizada com sucesso!");
        } else {
          console.log("Venda falhou. Tentará novamente na próxima verificação.");
        }
      }
    }
  } catch (error) {
    console.error(
      "Erro ao buscar dados da Binance:",
      error.response ? JSON.stringify(error.response.data, null, 2) : error.message
    );
  }
}

initializeBot().then(() => {
  setInterval(start, 3000);
  start();
});
