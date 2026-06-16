# SendGrid Email Integration Documentation

## Overview

This document describes the complete SendGrid email integration for the Myngly Ads Admin platform. The integration provides transactional email capabilities for user communication, campaign notifications, payment confirmations, and administrative email management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Admin Panel (React)                          │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Email Overview  │  │   Email Logs     │  │  Test/Bulk Email │  │
│  │   & Statistics   │  │   & Filtering    │  │     Forms        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                          ┌───────▼───────┐
                          │  API Client   │
                          │ (SendGrid_    │
                          │  emails.ts)   │
                          └───────┬───────┘
                                  │
                          ┌───────▼───────┐
                          │   REST API    │
                          │  (Express)    │
                          └───────┬───────┘
                                  │
     ┌────────────────────────────┼────────────────────────────┐
     │                            │                            │
┌────▼────┐  ┌────────────────────▼───────────────────┐  ┌────▼────┐
│ Routes  │  │              Controller                 │  │Validator│
│SendGrid_│  │       SendGrid_email.controller.ts     │  │SendGrid_│
│routes.ts│  └──────────┬───────────────┬─────────────┘  │validators│
└─────────┘             │               │                └──────────┘
                        │               │
           ┌────────────▼───────┐  ┌────▼────────────────┐
           │   Email Service    │  │   Admin Service     │
           │SendGrid_email.     │  │SendGrid_admin.      │
           │    service.ts      │  │    service.ts       │
           └────────┬───────────┘  └──────────┬──────────┘
                    │                         │
           ┌────────▼───────────┐             │
           │  Template Service  │             │
           │SendGrid_templates. │             │
           │    service.ts      │             │
           └────────┬───────────┘             │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      SendGrid API       │
                    │   (@sendgrid/mail)      │
                    └─────────────────────────┘
```

## Files Created

### Backend (API_Node)

| File | Description |
|------|-------------|
| `src/config/SendGrid_config.ts` | SendGrid client configuration and initialization |
| `src/types/SendGrid_types.ts` | TypeScript interfaces for all email-related data |
| `src/services/SendGrid_email.service.ts` | Main email service with all notification methods |
| `src/services/SendGrid_templates.service.ts` | HTML email templates with responsive styling |
| `src/services/SendGrid_admin.service.ts` | Bulk email, logging, and statistics service |
| `src/validators/SendGrid_validators.ts` | Zod validation schemas for all inputs |
| `src/controllers/SendGrid_email.controller.ts` | Express controller with all endpoints |
| `src/routes/SendGrid_routes.ts` | API route definitions |

### Frontend (Admin Panel - `admin/`)

| File | Description |
|------|-------------|
| `src/api/SendGrid_emails.ts` | API client for email endpoints (paths under `/admin/v1/email/`; only bulk send, recent logs, and stats -- test email and config status endpoints removed) |
| `src/pages/emails/SendGrid_Emails.tsx` | Email management dashboard page (Email Logs and Bulk Email tabs only; Test Email tab and SendGrid config status section removed -- no backend endpoints) |

### Frontend (Advertiser Webapp - src)

| File | Description |
|------|-------------|
| `src/types/api.ts` | API response types and interfaces |
| `src/api/client.ts` | Base API client with authentication |
| `src/api/SendGrid_emails.ts` | SendGrid API client for user features |
| `src/api/index.ts` | API exports |
| `src/pages/auth/ForgotPassword.tsx` | Updated with password reset email |
| `src/pages/auth/VerifyEmail.tsx` | Updated with resend verification |
| `src/pages/settings/NotificationsModal.tsx` | Email preferences management |

### Configuration Updates

| File | Changes |
|------|---------|
| `package.json` | Added `@sendgrid/mail` dependency |
| `src/routes/index.ts` | Added SendGrid routes to router |
| `.env.example` | Added SendGrid environment variables |

## Environment Variables

Add these variables to your `.env` file:

```env
# Required
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# Optional (with defaults)
SENDGRID_FROM_EMAIL=noreply@myngly.com
SENDGRID_FROM_NAME=Myngly Ads
SENDGRID_SANDBOX_MODE=false
SENDGRID_TRACK_OPENS=true
SENDGRID_TRACK_CLICKS=true

# Dynamic Templates (optional)
SENDGRID_TEMPLATE_WELCOME=
SENDGRID_TEMPLATE_VERIFY_EMAIL=
SENDGRID_TEMPLATE_PASSWORD_RESET=
SENDGRID_TEMPLATE_CAMPAIGN_APPROVED=
SENDGRID_TEMPLATE_CAMPAIGN_REJECTED=
SENDGRID_TEMPLATE_CAMPAIGN_STARTED=
SENDGRID_TEMPLATE_CAMPAIGN_PAUSED=
SENDGRID_TEMPLATE_CAMPAIGN_COMPLETED=
SENDGRID_TEMPLATE_PAYMENT_SUCCESSFUL=
SENDGRID_TEMPLATE_PAYMENT_FAILED=
SENDGRID_TEMPLATE_INVOICE=
```

## API Endpoints

### Admin Email Management

**Backend API Endpoints (served by the unified API):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/v1/email/bulk` | Send bulk emails to multiple recipients |
| GET | `/admin/v1/email/recent` | Get recent email logs |
| GET | `/admin/v1/email/stats` | Get email statistics |

> **Note (2026-02-04):** The admin panel frontend previously referenced `/email/test` and `/email/config/status` endpoints, but these do not exist on the backend. The `SendGrid_emails.ts` API client and the `SendGrid_Emails.tsx` page have been updated to remove these non-existent endpoints. The Test Email tab and SendGrid config status section have been removed from the admin UI.

### Notification Triggers

#### Authentication Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/notify/welcome` | Send welcome email to new user |
| POST | `/api/email/notify/verify-email` | Send email verification code |
| POST | `/api/email/notify/password-reset` | Send password reset link |

#### Campaign Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/notify/campaign/approved` | Notify campaign approved |
| POST | `/api/email/notify/campaign/rejected` | Notify campaign rejected |
| POST | `/api/email/notify/campaign/started` | Notify campaign started |
| POST | `/api/email/notify/campaign/paused` | Notify campaign paused |
| POST | `/api/email/notify/campaign/completed` | Notify campaign completed |
| POST | `/api/email/notify/campaign/budget-low` | Warn about low budget |

#### Payment Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/notify/payment/successful` | Confirm successful payment |
| POST | `/api/email/notify/payment/failed` | Notify failed payment |
| POST | `/api/email/notify/invoice` | Send invoice email |

## Email Templates

The integration includes 15 professional HTML email templates:

### Authentication Templates
1. **Welcome Email** - Sent to new users after registration
2. **Email Verification** - 6-digit verification code with expiration
3. **Password Reset** - Reset link with security notice
4. **Password Changed** - Security confirmation notification

### Campaign Templates
5. **Campaign Approved** - Approval confirmation with details
6. **Campaign Rejected** - Rejection with reason and support link
7. **Campaign Started** - Live notification with dashboard link
8. **Campaign Paused** - Pause notification with reason
9. **Campaign Resumed** - Resume confirmation
10. **Campaign Completed** - Performance summary with metrics
11. **Budget Low Warning** - Low budget alert with top-up link
12. **Budget Depleted** - Budget exhausted notification

### Payment Templates
13. **Payment Successful** - Receipt confirmation
14. **Payment Failed** - Failure notice with retry link
15. **Invoice Created** - Invoice with download link
16. **Refund Processed** - Refund confirmation

### Report Templates
17. **Weekly Report** - Campaign performance summary

## Request/Response Examples

### Send Bulk Email

**Request:**
```http
POST /admin/v1/email/bulk
Content-Type: application/json
Authorization: Bearer <token>

{
  "recipients": [
    { "email": "user1@example.com", "name": "User 1" },
    { "email": "user2@example.com", "name": "User 2" }
  ],
  "subject": "Newsletter",
  "html": "<h1>Newsletter</h1><p>Content here...</p>",
  "categories": ["newsletter"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "totalRecipients": 2,
    "successCount": 2,
    "failedCount": 0
  }
}
```

### Get Email Logs

**Request:**
```http
GET /admin/v1/email/recent
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "1",
        "messageId": "abc123",
        "to": "user@example.com",
        "toName": "User",
        "from": "noreply@myngly.com",
        "subject": "Welcome to Myngly Ads",
        "templateType": "welcome",
        "status": "sent",
        "userId": "user123",
        "sentAt": "2024-01-20T10:30:00Z",
        "categories": ["welcome", "authentication"]
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

### Get Email Statistics

**Request:**
```http
GET /admin/v1/email/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1250,
    "totalFailed": 15,
    "successRate": 98.8,
    "byTemplate": {
      "welcome": { "sent": 500, "failed": 2 },
      "campaign-started": { "sent": 300, "failed": 5 },
      "payment-successful": { "sent": 450, "failed": 8 }
    },
    "byDay": [
      { "date": "2024-01-18", "sent": 150, "failed": 2 },
      { "date": "2024-01-19", "sent": 175, "failed": 3 },
      { "date": "2024-01-20", "sent": 200, "failed": 1 }
    ]
  }
}
```

### Send Campaign Notification

**Request:**
```http
POST /api/email/notify/campaign/started
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user123",
  "email": "advertiser@example.com",
  "name": "John Smith",
  "campaignId": "camp456",
  "campaignName": "Summer Sale 2024",
  "campaignUrl": "https://app.myngly.com/campaigns/camp456",
  "startDate": "January 20, 2024",
  "endDate": "February 20, 2024",
  "budget": "$5,000.00",
  "dashboardUrl": "https://app.myngly.com/dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "def789ghi"
  }
}
```

## Service Usage Examples

### In Other Services/Controllers

```typescript
import { sendGridEmailService } from '../services/SendGrid_email.service.js';

// Send welcome email after user registration
await sendGridEmailService.sendWelcomeEmail({
  userId: user.id,
  email: user.email,
  name: user.name,
  verificationUrl: `${appUrl}/verify?token=${token}`,
});

// Send campaign started notification
await sendGridEmailService.sendCampaignStartedEmail({
  userId: campaign.userId,
  email: user.email,
  name: user.name,
  campaignId: campaign.id,
  campaignName: campaign.name,
  campaignUrl: `${appUrl}/campaigns/${campaign.id}`,
  startDate: formatDate(campaign.startDate),
  endDate: formatDate(campaign.endDate),
  budget: formatCurrency(campaign.budget),
  dashboardUrl: `${appUrl}/dashboard`,
});

// Send payment confirmation
await sendGridEmailService.sendPaymentSuccessfulEmail({
  userId: payment.userId,
  email: user.email,
  name: user.name,
  transactionId: payment.id,
  amount: formatCurrency(payment.amount),
  currency: 'USD',
  paymentMethod: 'Visa •••• 4242',
  campaignName: campaign.name,
  receiptUrl: payment.receiptUrl,
});
```

## Admin Panel Features

### Email Logs Tab
- Recent email history (via `/admin/v1/email/recent`)
- Displays status, recipients, subjects, timestamps
- Filterable email log view

### Bulk Email Tab
- Multi-recipient support
- Subject and HTML/text content
- Send via `/admin/v1/email/bulk`
- Progress and error reporting

### Email Statistics
- Total sent/failed email counts (via `/admin/v1/email/stats`)
- Success rate percentage
- Email breakdown by template type
- Last 7 days activity chart

> **Removed (2026-02-04):** The Test Email tab and SendGrid configuration status section were removed because the backend does not expose `/email/test` or `/email/config/status` endpoints.

## Template Styling

All email templates include:

- **Responsive Design**: Mobile-friendly layouts
- **Brand Colors**: Consistent Myngly branding (#2563eb blue)
- **Clear CTAs**: Prominent action buttons
- **Footer**: Company info and unsubscribe placeholders
- **Plain Text Fallback**: For email clients without HTML support

## Error Handling

The integration handles:

- **API Key Missing**: Returns `SendGrid is not configured` error
- **Invalid Recipients**: Validation errors with details
- **Rate Limiting**: SendGrid batch processing (1000 per call)
- **Network Errors**: Captured and logged
- **Template Errors**: Fallback to basic HTML

## Sandbox Mode

For development/testing:

```env
SENDGRID_SANDBOX_MODE=true
```

When enabled:
- Emails are validated but not delivered
- Useful for testing without sending real emails
- No email credits consumed

## Best Practices

1. **Always validate email addresses** before sending
2. **Use categories** for better tracking and analytics
3. **Include unsubscribe links** in marketing emails
4. **Monitor success rates** via the admin panel
5. **Test templates** before production use
6. **Use sandbox mode** for development

## Installation

1. Install the SendGrid package:
```bash
cd API_Node
npm install @sendgrid/mail
```

2. Set up environment variables (see above)

3. Import and use the services in your code

## Security Considerations

- API key stored in environment variables only
- All endpoints require authentication
- Input validation on all requests
- Email content sanitization
- Rate limiting on bulk operations

## Future Enhancements

- [ ] Email scheduling with queue
- [ ] Email template editor in admin panel
- [ ] A/B testing for email campaigns
- [ ] Webhook integration for delivery status
- [ ] Advanced analytics dashboard
- [ ] Email preference center for users

## Support

For issues related to:
- **SendGrid API**: [SendGrid Documentation](https://docs.sendgrid.com/)
- **Integration**: Check the controller and service files
- **Templates**: Modify `SendGrid_templates.service.ts`

---

*Last updated: February 2026*
*Integration version: 1.1.0*
