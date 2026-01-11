import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import * as Handlebars from 'handlebars';
import { ERRORS } from '../common/constants';

@Injectable()
export class TemplateService {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {
    this.registerHelpers();
  }

  private registerHelpers() {
    // Register Handlebars helpers
    Handlebars.registerHelper('currency', function (value: number) {
      return `$${value.toFixed(2)}`;
    });

    Handlebars.registerHelper('date', function (date: Date) {
      return new Date(date).toLocaleDateString();
    });

    Handlebars.registerHelper('datetime', function (date: Date) {
      return new Date(date).toLocaleString();
    });
  }

  async getTemplate(name: string, language: string = 'en'): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { name, language, isActive: true },
    });

    if (!template) {
      // Fallback to English if language-specific template not found
      if (language !== 'en') {
        return this.getTemplate(name, 'en');
      }
      throw new Error(`${ERRORS.INVALID_TEMPLATE}: ${name}`);
    }

    return template;
  }

  async renderTemplate(
    templateName: string,
    data: Record<string, any>,
    language: string = 'en',
  ): Promise<{ subject: string; html: string; text: string }> {
    try {
      const template = await this.getTemplate(templateName, language);

      // Get or compile template
      const cacheKey = `${templateName}_${language}`;
      let compiledHtml = this.compiledTemplates.get(`${cacheKey}_html`);
      let compiledText = this.compiledTemplates.get(`${cacheKey}_text`);
      let compiledSubject = this.compiledTemplates.get(`${cacheKey}_subject`);

      if (!compiledHtml) {
        compiledHtml = Handlebars.compile(template.htmlContent || template.content);
        this.compiledTemplates.set(`${cacheKey}_html`, compiledHtml);
      }

      if (!compiledText) {
        compiledText = Handlebars.compile(template.content);
        this.compiledTemplates.set(`${cacheKey}_text`, compiledText);
      }

      if (!compiledSubject) {
        compiledSubject = Handlebars.compile(template.subject || '');
        this.compiledTemplates.set(`${cacheKey}_subject`, compiledSubject);
      }

      return {
        subject: compiledSubject(data),
        html: compiledHtml(data),
        text: compiledText(data),
      };
    } catch (error) {
      throw new Error(`${ERRORS.TEMPLATE_RENDER_ERROR}: ${error.message}`);
    }
  }

  async createTemplate(data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async updateTemplate(
    name: string,
    updates: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { name } });
    if (!template) {
      throw new Error(`${ERRORS.INVALID_TEMPLATE}: ${name}`);
    }

    Object.assign(template, updates);
    const saved = await this.templateRepository.save(template);

    // Invalidate cache
    this.compiledTemplates.delete(`${name}_html`);
    this.compiledTemplates.delete(`${name}_text`);
    this.compiledTemplates.delete(`${name}_subject`);

    return saved;
  }

  async deleteTemplate(name: string): Promise<void> {
    await this.templateRepository.delete({ name });
    this.compiledTemplates.delete(`${name}_html`);
    this.compiledTemplates.delete(`${name}_text`);
    this.compiledTemplates.delete(`${name}_subject`);
  }
}
