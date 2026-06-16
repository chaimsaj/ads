import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAuthenticate, createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { EmailController } from './controllers/email.controller';
import { EmailAdminController } from './controllers/email-admin.controller';
import { createEmailRoutes } from './routes/email.routes';
import { createEmailAdminRoutes } from './routes/email-admin.routes';
import { EmailService } from './services/email.service';
import { EmailAdminService } from './services/email-admin.service';
import { EmailTemplateAccountService } from './services/email-template-account.service';
import { EmailTemplateCampaignService } from './services/email-template-campaign.service';

export function buildNotificationDomain(tokenService: ITokenService) {
  // Services
  const emailService = new EmailService();
  const templateAccountService = new EmailTemplateAccountService(emailService);
  const templateCampaignService = new EmailTemplateCampaignService(emailService);
  const adminService = new EmailAdminService(emailService);

  // Controllers
  const emailController = new EmailController(templateAccountService);
  const emailAdminController = new EmailAdminController(adminService);

  // Middleware
  const authenticate = createAuthenticate(tokenService);
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const emailRoutes = createEmailRoutes(emailController, authenticate);
  const emailAdminRoutes = createEmailAdminRoutes(emailAdminController, adminAuthenticate);

  return { emailRoutes, emailAdminRoutes, emailService, templateAccountService, templateCampaignService };
}
