import sgMail from '@sendgrid/mail';

import { getEnv } from '../../../config/environment';
import { createLogger } from '../../../infrastructure/logging/logger';

const logger = createLogger('sendgrid-config');

let _configured = false;

export function getSendGridClient(): typeof sgMail {
  if (!_configured) {
    const env = getEnv();
    const apiKey = env.SENDGRID_API_KEY;

    if (!apiKey) {
      logger.warn('SENDGRID_API_KEY is not configured. Email sending will be disabled.');
      return sgMail;
    }

    sgMail.setApiKey(apiKey);
    _configured = true;
  }

  return sgMail;
}

export function isSendGridConfigured(): boolean {
  const env = getEnv();
  return !!env.SENDGRID_API_KEY && !!env.SENDGRID_FROM_EMAIL;
}

export function getFromEmail(): { email: string; name: string } {
  const env = getEnv();
  return {
    email: env.SENDGRID_FROM_EMAIL ?? 'noreply@myngly.com',
    name: env.SENDGRID_FROM_NAME,
  };
}
