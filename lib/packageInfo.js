const fs = require("fs");
const path = require("path");

function readPackageJson() {
  const p = path.join(__dirname, "..", "package.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

module.exports = { readPackageJson };
