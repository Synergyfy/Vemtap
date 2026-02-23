const main = require('../dist/main');

module.exports = async (req, res) => { const bootstrap = main.default || main; return bootstrap(req, res); };