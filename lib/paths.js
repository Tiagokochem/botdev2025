const path = require("path");

const ROOT = path.resolve(__dirname, "..");

module.exports = {
  ROOT,
  STATE_FILE: path.join(ROOT, "state.json"),
  TRADES_FILE: path.join(ROOT, "trades.json"),
};
