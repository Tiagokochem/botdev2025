const axios = require("axios");
const fs = require("fs");
const { API_URL, API_KEY } = require("./config");
const { RSI, ATR, calculateBollingerBands, calculateMACD } = require("./utils");
const { getBalance, newOrder, getSymbolFilters } = require("./trade");

const SYMBOL = "BTCUSDT";
const PERIOD = 14;

// Taxa de 0.1% por operação => 0.2% total (ida+volta)
const FEE_RATE = 0.001;
const TOTAL_FEE = FEE_RATE * 2;

// Você não quer vender com prejuízo, então definimos lucros >= 0
// (Se quiser pelo menos 1% de lucro, ponha 0.01)
const MIN_PROFIT_MARGIN = 0.0;

// Take Profit se o preço subir 15% acima do buyPrice + taxas
const TAKE_PROFIT_PERCENT = 0.15;

const STATE_FILE = "./state.json";
const TRADES_FILE = "./trades.json";

// Carrega estado do bot
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }
  return { isOpened: false, buyPrice: 0 };
}

// Salva estado no arquivo
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Registra trades em arquivo
function saveTrade(tradeData) {
  let trades = [];
  if (fs.existsSync(TRADES_FILE)) {
    trades = JSON.parse(fs.readFileSync(TRADES_FILE, "utf8"));
  }
  trades.push(tradeData);
  fs.writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2));
}

let state = loadState();
let isOpened = state.isOpened;
let buyPrice = state.buyPrice;

// Verifica se já existe BTC na conta ao iniciar
async function initializeBot() {
  try {
    const btcBalance = await getBalance("BTC");
    const usdtBalance = await getBalance("USDT");

    if (btcBalance >= 0.00001) {
      isOpened = true;
      const { data: ticker } = await axios.get(`${API_URL}/api/v3/ticker/price?symbol=${SYMBOL}`);

      if (state.buyPrice === 0) {
        buyPrice = parseFloat(ticker.price);
      }
    } else {
      isOpened = false;
      buyPrice = 0;
    }

    if (state.buyPrice > 0) {
      return;
    }

    saveState({ isOpened, buyPrice });
  } catch (error) {
    console.error("Erro ao inicializar o bot:", error.message);
  }
}

// Lógica principal
async function start() {
  try {
    // Obter candles
    const response = await axios.get(
      `${API_URL}/api/v3/klines?limit=100&interval=5m&symbol=${SYMBOL}`,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
        timeout: 5000,
      }
    );

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

    // Preço de fechamento do último candle
    const lastPrice = parseFloat(lastCandle[4]);

    // Arrays: fechamento, máxima, mínima
    const closes = data.map(k => parseFloat(k[4])).filter(v => !isNaN(v));
    const highs = data.map(k => parseFloat(k[2])).filter(v => !isNaN(v));
    const lows = data.map(k => parseFloat(k[3])).filter(v => !isNaN(v));

    // Checa se há candles suficientes
    const minCount = Math.min(closes.length, highs.length, lows.length);
    if (minCount < 20) {
      console.error("Erro: Arrays de candles incompletos (<20).");
      return;
    }

    // Calcula indicadores
    const rsi = RSI(closes, PERIOD);
    const atr = ATR(highs, lows, closes, 14);
    const bollinger = calculateBollingerBands(closes);
    const macd = calculateMACD(closes);

    // Valida indicadores
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

    // Lógica de compra: RSI < 30
    if (rsi < 30 && !isOpened) {
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
    }

    // Lógica de venda: jamais vender com prejuízo
    else if (isOpened) {
      const profit = ((lastPrice - buyPrice) / buyPrice) - TOTAL_FEE;
      console.log(`Lucro estimado: ${(profit * 100).toFixed(2)}%`);

      // Se o lucro for menor que zero, não vende (não aceita prejuízo)
      if (profit < MIN_PROFIT_MARGIN) {
        console.log("Lucro negativo ou abaixo do mínimo. Mantendo posição para não ter prejuízo.");
        return;
      }

      // Checa se RSI está > 70 (sobrecomprado) ou se chegou no TAKE_PROFIT
      const rsiHigh = (rsi > 70);
      const priceHighEnough = (lastPrice >= buyPrice * (1 + TAKE_PROFIT_PERCENT));

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
    console.error("Erro ao buscar dados da Binance:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// Ajusta quantidade de acordo com stepSize
function quantizeQuantity(amount, stepSize) {
  const decimals = (stepSize.toString().split('.')[1] || '').length;
  return parseFloat(Math.floor(amount * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

// placeOrder, sem check de global.buyPrice
async function placeOrder(symbol, side, price) {
  try {
    const filters = await getSymbolFilters(symbol);
    if (!filters) return false;

    const minQty = filters.LOT_SIZE.minQty;
    const stepSize = filters.LOT_SIZE.stepSize;

    let quantity = 0;
    if (side === "BUY") {
      const usdtBalance = await getBalance("USDT");
      const maxQuantity = usdtBalance / price;
      quantity = quantizeQuantity(maxQuantity, stepSize);
    } else if (side === "SELL") {
      const btcBalance = await getBalance("BTC");
      quantity = quantizeQuantity(btcBalance, stepSize);
    }

    if (quantity < minQty) {
      console.error("Quantidade inválida para ordem");
      return false;
    }

    console.log(`Tentando ${side} ${quantity} BTC a ${price} USDT`);
    const orderSuccess = await newOrder(symbol, side, price);

    if (orderSuccess) {
      saveTrade({
        timestamp: Date.now(),
        symbol,
        side,
        price,
        quantity,
        status: "FILLED",
      });
    }

    return orderSuccess;
  } catch (error) {
    console.error("Erro ao colocar ordem:", error.message);
    return false;
  }
}

// Inicia o bot
initializeBot().then(() => {
  setInterval(start, 3000);
  start();
});
