import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${metaStr}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export function createLogger(context?: string): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  return winston.createLogger({
    level: isTest ? 'error' : isProduction ? 'info' : 'debug',
    defaultMeta: context ? { context } : undefined,
    format: isProduction ? prodFormat : devFormat,
    transports: [new winston.transports.Console({ silent: isTest })],
  });
}

export const logger = createLogger();
