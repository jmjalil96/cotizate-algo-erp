import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors.js';

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailJobResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

let transporter: Transporter | null = null;

export const getTransporter = (): Transporter => {
  if (!transporter) {
    const config = {
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      ...(env.MAIL_USER && env.MAIL_PASS && {
        auth: {
          user: env.MAIL_USER,
          pass: env.MAIL_PASS,
        }
      }),
      tls: {
        rejectUnauthorized: env.NODE_ENV === 'production',
      },
    };

    transporter = nodemailer.createTransport(config);
    
    logger.info({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
    }, 'Email transporter configured');
  }

  return transporter as Transporter;
};

export const sendEmail = async (options: SendEmailOptions): Promise<EmailJobResult> => {
  const transport = getTransporter();
  
  try {
    const result = await transport.sendMail({
      from: options.from ?? env.MAIL_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.debug({
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      to: options.to,
      subject: options.subject,
    }, 'Email sent successfully');

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
      rejected: result.rejected as string[],
    };
  } catch (error) {
    logger.error({
      error,
      to: options.to,
      subject: options.subject,
    }, 'Failed to send email');

    if (error instanceof Error) {
      const statusCode = error.message.includes('ECONNREFUSED') ? 503 : 500;
      const code = error.message.includes('ECONNREFUSED') ? 'EMAIL_SERVICE_UNAVAILABLE' : 'EMAIL_SEND_FAILED';
      
      throw new AppError(
        statusCode,
        `Failed to send email: ${error.message}`,
        code,
        { originalError: error.message }
      );
    }
    
    throw new AppError(
      500,
      'Failed to send email',
      'EMAIL_SEND_FAILED'
    );
  }
};

export const verifyConnection = async (): Promise<boolean> => {
  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info('Email service connection verified');
    return true;
  } catch (error) {
    logger.error({ error }, 'Email service connection verification failed');
    return false;
  }
};

export const closeTransporter = async (): Promise<void> => {
  if (transporter) {
    transporter.close();
    transporter = null;
    logger.info('Email transporter closed');
  }
};