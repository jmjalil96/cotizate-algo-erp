# Email Service

A robust email service using BullMQ queues, Redis, Handlebars templates, and Nodemailer.

## Setup

### 1. Start Docker Services

```bash
# Start Redis and Inbucket
docker-compose up -d
```

### 2. Environment Variables

Ensure these are configured in your `.env` file:

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Development - Inbucket)
MAIL_HOST=localhost
MAIL_PORT=2500
MAIL_FROM=noreply@example.com
```

### 3. Start the Email Worker

```bash
# Development with auto-reload
npm run email:worker:dev

# Production
npm run email:worker
```

## Usage

### Send an Email

```typescript
import { queueEmail } from './email/index.js';

// Queue a welcome email
const jobId = await queueEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: {
    name: 'John Doe',
    activationUrl: 'https://app.example.com/activate?token=abc123',
  },
});
```

### Available Templates

- `welcome` - New user welcome email
- `reset-password` - Password reset request

### Check Email Status

```typescript
import { getEmailJobStatus, getQueueStats } from './email/index.js';

// Check specific job
const status = await getEmailJobStatus(jobId);

// Get queue statistics
const stats = await getQueueStats();
```

## Development

### View Sent Emails

Open Inbucket UI: http://localhost:9000

### Create New Templates

1. Add template file to `src/email/templates/`
2. Use Handlebars syntax
3. Template automatically available by filename (without .hbs)

### Template Data

Base layout expects:

- `companyName` - Company name for header/footer
- `currentYear` - Copyright year
- `unsubscribeUrl` - Optional unsubscribe link

## Production

### Configuration

```env
# Use real SMTP provider
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=true
MAIL_USER=apikey
MAIL_PASS=your_sendgrid_api_key
```

### Deployment

1. Build: `npm run build`
2. Run worker: `npm run email:worker:build`
3. Monitor queue health via `getQueueStats()`

## Architecture

```
API → Queue (Redis) → Worker → Nodemailer → SMTP
         ↓                ↓
    Job Storage      Templates
```

- **Queue**: Handles retries, delays, and job persistence
- **Worker**: Processes jobs independently from main app
- **Templates**: Cached in memory for performance
- **Sender**: Manages SMTP connection and error handling
