const constants = require("../lib/constants");

describe("lib/constants", () => {
  it("expõe símbolo e limiares RSI", () => {
    expect(constants.SYMBOL).toBe("BTCUSDT");
    expect(constants.RSI_OVERSOLD).toBe(30);
    expect(constants.RSI_OVERBOUGHT).toBe(70);
  });

  it("taxa total implícita é 0.2% ida e volta", () => {
    expect(constants.FEE_RATE * 2).toBeCloseTo(0.002, 6);
  });
});
