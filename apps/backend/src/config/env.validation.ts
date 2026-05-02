import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('KTE Jegyportal API'),
  APP_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().required(),
  HOME_TEAM_NAME: Joi.string().default('Kecskeméti TE'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  REDIS_KEY_PREFIX: Joi.string().default('kte:'),

  // Seat lock
  SEAT_LOCK_TTL_SECONDS: Joi.number().integer().min(30).default(300),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Bcrypt
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_CURRENCY: Joi.string().lowercase().length(3).default('huf'),

  // Anthropic
  ANTHROPIC_API_KEY: Joi.string().required(),
  ANTHROPIC_MODEL: Joi.string().default('claude-sonnet-4-20250514'),
  ANTHROPIC_MAX_TOKENS: Joi.number().integer().min(64).default(1024),

  // OpenWeatherMap
  OPENWEATHER_API_KEY: Joi.string().allow('').optional(),
  OPENWEATHER_CITY: Joi.string().default('Kecskemet,HU'),
  OPENWEATHER_CACHE_TTL_SECONDS: Joi.number().integer().min(60).default(3600),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().port().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().allow('').required(),
  MAIL_FROM: Joi.string().email().required(),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
});
