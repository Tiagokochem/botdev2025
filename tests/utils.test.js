const { RSI, ATR, calculateBollingerBands } = require("../utils");

describe("utils", () => {
  describe("RSI", () => {
    it("retorna valor entre 0 e 100", () => {
      const closes = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 2);
      const r = RSI(closes, 14);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });

    it("retorna 50 com dados insuficientes", () => {
      expect(RSI([100, 101], 14)).toBe(50);
    });
  });

  describe("ATR", () => {
    it("retorna 0 sem dados suficientes", () => {
      expect(ATR([1], [1], [1], 14)).toBe(0);
    });

    it("retorna número positivo com série válida", () => {
      const n = 25;
      const highs = Array.from({ length: n }, (_, i) => 110 + i * 0.1);
      const lows = Array.from({ length: n }, (_, i) => 100 + i * 0.1);
      const closes = Array.from({ length: n }, (_, i) => 105 + i * 0.1);
      const atr = ATR(highs, lows, closes, 14);
      expect(atr).toBeGreaterThan(0);
    });
  });

  describe("calculateBollingerBands", () => {
    it("retorna nulls com período curto", () => {
      const bb = calculateBollingerBands([1, 2, 3], 20);
      expect(bb.upper).toBeNull();
      expect(bb.lower).toBeNull();
    });
  });
});
