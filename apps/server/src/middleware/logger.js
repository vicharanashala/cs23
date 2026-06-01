const morgan = require('morgan');

// Custom token: request id (generated once per request, stored on req)
morgan.token('request-id', (req) => req.id);

// Format string — concise, includes method / path / status / response-time / size
const FORMAT = ':request-id :method :url :status :res[content-length] - :response-time ms';

module.exports = morgan(FORMAT);