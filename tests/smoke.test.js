const { readPackageJson } = require("../lib/packageInfo");

describe("smoke", () => {
  it("carrega package.json com nome e main", () => {
    const pkg = readPackageJson();
    expect(pkg.name).toBeDefined();
    expect(pkg.main).toBe("index.js");
  });
});
