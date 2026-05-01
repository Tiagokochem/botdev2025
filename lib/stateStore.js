const fs = require("fs");
const { STATE_FILE, TRADES_FILE } = require("./paths");

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }
  return { isOpened: false, buyPrice: 0 };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function appendTrade(tradeData) {
  let trades = [];
  if (fs.existsSync(TRADES_FILE)) {
    trades = JSON.parse(fs.readFileSync(TRADES_FILE, "utf8"));
  }
  trades.push(tradeData);
  fs.writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2));
}

module.exports = { loadState, saveState, appendTrade };
