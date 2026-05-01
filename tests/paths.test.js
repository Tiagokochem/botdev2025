const path = require("path");
const { ROOT, STATE_FILE, TRADES_FILE } = require("../lib/paths");

describe("lib/paths", () => {
  it("STATE_FILE e TRADES_FILE ficam na raiz do projeto", () => {
    expect(path.basename(STATE_FILE)).toBe("state.json");
    expect(path.basename(TRADES_FILE)).toBe("trades.json");
    expect(ROOT).toBe(path.resolve(__dirname, ".."));
  });
});
