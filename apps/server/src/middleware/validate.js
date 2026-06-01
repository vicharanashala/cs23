const ApiError = require('../utils/ApiError');
const { ZodError } = require('zod');

/**
 * validate(schema, source) — Express middleware factory for Zod validation.
 *
 * @param {import('zod').ZodSchema} schema  — Zod schema to validate against
 * @param {'body'|'query'|'params'} source  — which part of the request to validate
 *
 * Usage:
 *   router.post('/tickets', validate(ticketSchema, 'body'), ticketController);
 *   router.get('/faq', validate(faqQuerySchema, 'query'), faqController);
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw Object.assign(new ApiError(400, 'Validation error'), { errors });
    }

    // Replace raw request field with parsed+transformed value
    req[source] = result.data;
    next();
  };
}

module.exports = validate;