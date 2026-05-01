const { quantizeQuantity } = require("../lib/quantize");

describe("lib/quantize", () => {
  it("respeita stepSize por número de casas decimais", () => {
    expect(quantizeQuantity(0.123456, 0.00001)).toBeCloseTo(0.12345, 8);
  });

  it("floor para múltiplo do step", () => {
    const q = quantizeQuantity(0.10009, 0.00001);
    expect(q).toBeCloseTo(0.10009, 8);
  });
});
