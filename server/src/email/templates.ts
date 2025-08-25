import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import Handlebars from 'handlebars';

import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type CompiledTemplates = Record<string, Handlebars.TemplateDelegate>;

const compiledTemplates: CompiledTemplates = {};
let baseLayout: Handlebars.TemplateDelegate | null = null;

Handlebars.registerHelper('formatDate', (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatTime', (date: Date | string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

Handlebars.registerHelper('uppercase', (str: string) => {
  return str?.toUpperCase() ?? '';
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str?.toLowerCase() ?? '';
});

export const loadTemplate = (templateName: string): string => {
  const templatePath = join(__dirname, 'templates', `${templateName}.hbs`);
  try {
    return readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger.error({ error, templateName }, 'Failed to load template');
    throw new AppError(
      500,
      `Template not found: ${templateName}`,
      'TEMPLATE_NOT_FOUND',
      { templateName }
    );
  }
};

export const loadBaseLayout = (): void => {
  try {
    const layoutPath = join(__dirname, 'templates', 'layouts', 'base.hbs');
    const layoutContent = readFileSync(layoutPath, 'utf8');
    baseLayout = Handlebars.compile(layoutContent);
    logger.info('Base email layout loaded');
  } catch (error) {
    logger.warn({ error }, 'No base layout found, using templates directly');
    baseLayout = null;
  }
};

export const compileTemplate = (templateName: string): Handlebars.TemplateDelegate => {
  if (!compiledTemplates[templateName]) {
    const templateContent = loadTemplate(templateName);
    compiledTemplates[templateName] = Handlebars.compile(templateContent);
    logger.debug({ templateName }, 'Template compiled and cached');
  }
  return compiledTemplates[templateName];
};

export const renderTemplate = (templateName: string, data: Record<string, unknown>): string => {
  try {
    const template = compileTemplate(templateName);
    let html = template(data);

    if (baseLayout) {
      html = baseLayout({
        ...data,
        body: html,
      });
    }

    return html;
  } catch (error) {
    logger.error({ error, templateName, data }, 'Failed to render template');
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      500,
      'Failed to render email template',
      'TEMPLATE_RENDER_FAILED',
      { templateName, error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
};

export const initializeTemplates = (): void => {
  loadBaseLayout();
  logger.info('Email templates initialized');
};

export const clearTemplateCache = (): void => {
  for (const key of Object.keys(compiledTemplates)) {
    compiledTemplates[key] = undefined as never;
  }
  baseLayout = null;
  logger.info('Template cache cleared');
};