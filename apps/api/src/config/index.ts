import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'navdrishti_jwt_super_secret_key_sih26248_production_grade',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'navdrishti_refresh_super_secret_key_sih26248_production_grade',
  corsOrigin: process.env.CORS_ORIGIN || process.env.WEB_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || process.env.WEB_URL || 'http://localhost:3000',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  accessTokenExpiry: '15m',
  refreshTokenExpiryDays: 7,
};
