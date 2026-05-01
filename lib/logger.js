/**
 * Fachada de log para facilitar testes e padronizar prefixos.
 */
function logInfo(...args) {
  console.log(...args);
}

function logError(...args) {
  console.error(...args);
}

module.exports = { logInfo, logError };
