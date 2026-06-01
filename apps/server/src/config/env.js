require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.string().min(1, 'PORT is required'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  ADMIN_URL: z.string().min(1, 'ADMIN_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.errors.map((e) => `  - ${e.message}`).join('\n');
  console.error('\n❌ Server startup failed — missing or invalid environment variables:\n' + missing + '\n');
  process.exit(1);
}

const env = parsed.data;

module.exports = {
  env,
  MONGODB_URI: env.MONGODB_URI,
  JWT_SECRET: env.JWT_SECRET,
  PORT: env.PORT,
  CLIENT_URL: env.CLIENT_URL,
  ADMIN_URL: env.ADMIN_URL,
  NODE_ENV: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
};