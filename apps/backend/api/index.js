const main = require('../dist/src/main');

module.exports = async (req, res) => { const bootstrap = main.default || main; return bootstrap(req, res); };