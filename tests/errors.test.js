const { BinanceApiError } = require("../lib/errors");

describe("lib/errors", () => {
  it("preserva code e status", () => {
    const err = new BinanceApiError("fail", { code: -1022, status: 400 });
    expect(err.name).toBe("BinanceApiError");
    expect(err.code).toBe(-1022);
    expect(err.status).toBe(400);
  });
});
