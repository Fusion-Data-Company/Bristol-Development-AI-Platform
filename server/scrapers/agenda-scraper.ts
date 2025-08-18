import { BaseScraper } from './base-scraper';
import { AgendaConfig } from '../config/competitor-config';
import * as cheerio from 'cheerio';

export class AgendaScraper extends BaseScraper {
  private config: AgendaConfig;

  constructor(jurisdiction: string, config: AgendaConfig) {
    super('Agenda Scraper', jurisdiction, config.label);
    this.config = config;
  }

  async scrape(options?: { daysBack?: number }): Promise<{ recordsFound: number; recordsNew: number }> {
    const daysBack = options?.daysBack || 30;
    await this.startJob({ daysBack });

    try {
      console.log(`🔍 Scraping ${this.config.label} agendas`);

      let recordsFound = 0;
      let recordsNew = 0;

      switch (this.config.type) {
        case 'civicclerk':
          const civicResult = await this.scrapeCivicClerk(daysBack);
          recordsFound += civicResult.recordsFound;
          recordsNew += civicResult.recordsNew;
          break;

        case 'civicplus':
          const civicplusResult = await this.scrapeCivicPlus(daysBack);
          recordsFound += civicplusResult.recordsFound;
          recordsNew += civicplusResult.recordsNew;
          break;

        case 'html':
          const htmlResult = await this.scrapeHTML(daysBack);
          recordsFound += htmlResult.recordsFound;
          recordsNew += htmlResult.recordsNew;
          break;

        case 'rss':
          const rssResult = await this.scrapeRSS(daysBack);
          recordsFound += rssResult.recordsFound;
          recordsNew += rssResult.recordsNew;
          break;

        default:
          console.warn(`Unsupported agenda type: ${this.config.type}`);
      }

      console.log(`✅ Found ${recordsFound} agendas, ${recordsNew} with significant items`);
      await this.completeJob(recordsFound, recordsNew);
      return { recordsFound, recordsNew };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Agenda scraper error: ${errorMsg}`);
      await this.failJob(errorMsg);
      throw error;
    }
  }

  private async scrapeCivicClerk(daysBack: number): Promise<{ recordsFound: number; recordsNew: number }> {
    try {
      // CivicClerk API endpoint
      const apiUrl = `${this.config.url}/api/meetings`;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CivicClerk API error: ${response.status}`);
      }

      const meetings = await response.json();
      let recordsFound = 0;
      let recordsNew = 0;

      for (const meeting of meetings) {
        const meetingDate = new Date(meeting.date);
        if (meetingDate < cutoffDate) continue;

        recordsFound++;

        // Check if agenda contains development items
        const hasDevItems = await this.checkForDevelopmentItems(meeting);
        if (!hasDevItems) continue;

        await this.saveSignal({
          type: 'agenda',
          sourceId: meeting.id || `${meeting.date}_${meeting.name}`,
          title: `${meeting.name}: ${meeting.date}`,
          whenIso: meetingDate,
          link: meeting.agendaUrl || `${this.config.url}/meeting/${meeting.id}`,
          rawData: meeting,
          priority: 7,
          address: null
        });

        recordsNew++;
      }

      return { recordsFound, recordsNew };

    } catch (error) {
      console.error('CivicClerk scraping error:', error);
      return { recordsFound: 0, recordsNew: 0 };
    }
  }

  private async scrapeCivicPlus(daysBack: number): Promise<{ recordsFound: number; recordsNew: number }> {
    try {
      const response = await fetch(this.config.url);
      if (!response.ok) {
        throw new Error(`CivicPlus fetch error: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      let recordsFound = 0;
      let recordsNew = 0;

      // CivicPlus typically uses table or list structure
      $('.agendaRow, .agenda-item, tr[data-meeting]').each(async (i, elem) => {
        const $elem = $(elem);
        
        // Extract date
        const dateText = $elem.find('.date, .meeting-date, td:first-child').text();
        const meetingDate = this.parseDate(dateText);
        if (meetingDate < cutoffDate) return;

        recordsFound++;

        // Extract agenda link
        const agendaLink = $elem.find('a[href*="agenda"], a[href*="Agenda"]').attr('href');
        if (!agendaLink) return;

        const fullLink = new URL(agendaLink, this.config.url).href;
        
        // Get agenda title
        const title = $elem.find('.title, .meeting-name, td:nth-child(2)').text().trim();

        // Check for development keywords in title
        if (!this.hasDevelopmentKeywords(title)) return;

        await this.saveSignal({
          type: 'agenda',
          sourceId: fullLink,
          title: title || 'Planning Commission Meeting',
          whenIso: meetingDate,
          link: fullLink,
          rawData: { dateText, title },
          priority: 7,
          address: null
        });

        recordsNew++;
      });

      return { recordsFound, recordsNew };

    } catch (error) {
      console.error('CivicPlus scraping error:', error);
      return { recordsFound: 0, recordsNew: 0 };
    }
  }

  private async scrapeHTML(daysBack: number): Promise<{ recordsFound: number; recordsNew: number }> {
    try {
      const response = await fetch(this.config.url);
      if (!response.ok) {
        throw new Error(`HTML fetch error: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      let recordsFound = 0;
      let recordsNew = 0;

      // Generic HTML scraping - look for links with dates
      $('a').each(async (i, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        const text = $link.text();

        if (!href || !text) return;

        // Check if this looks like an agenda link
        if (!text.toLowerCase().includes('agenda') && 
            !href.toLowerCase().includes('agenda')) {
          return;
        }

        // Try to extract date from text or nearby elements
        const dateMatch = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
        if (!dateMatch) return;

        const meetingDate = this.parseDate(dateMatch[1]);
        if (meetingDate < cutoffDate) return;

        recordsFound++;

        // Check for development keywords
        if (!this.hasDevelopmentKeywords(text)) return;

        const fullLink = new URL(href, this.config.url).href;

        await this.saveSignal({
          type: 'agenda',
          sourceId: fullLink,
          title: text.trim(),
          whenIso: meetingDate,
          link: fullLink,
          rawData: { text },
          priority: 6,
          address: null
        });

        recordsNew++;
      });

      return { recordsFound, recordsNew };

    } catch (error) {
      console.error('HTML scraping error:', error);
      return { recordsFound: 0, recordsNew: 0 };
    }
  }

  private async scrapeRSS(daysBack: number): Promise<{ recordsFound: number; recordsNew: number }> {
    try {
      const response = await fetch(this.config.url);
      if (!response.ok) {
        throw new Error(`RSS fetch error: ${response.status}`);
      }

      const rssText = await response.text();
      const parser = new (await import('fast-xml-parser')).XMLParser();
      const feed = parser.parse(rssText);

      const items = feed?.rss?.channel?.item || feed?.feed?.entry || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      let recordsFound = 0;
      let recordsNew = 0;

      for (const item of itemsArray) {
        const pubDate = new Date(item.pubDate || item.published || item.updated);
        if (pubDate < cutoffDate) continue;

        recordsFound++;

        const title = item.title || '';
        const description = item.description || item.summary || '';
        const content = title + ' ' + description;

        // Check for development keywords
        if (!this.hasDevelopmentKeywords(content)) continue;

        await this.saveSignal({
          type: 'agenda',
          sourceId: item.guid || item.id || item.link,
          title: title,
          whenIso: pubDate,
          link: item.link || item.id,
          rawData: { title, description },
          priority: 6,
          address: null
        });

        recordsNew++;
      }

      return { recordsFound, recordsNew };

    } catch (error) {
      console.error('RSS scraping error:', error);
      return { recordsFound: 0, recordsNew: 0 };
    }
  }

  private async checkForDevelopmentItems(meeting: any): boolean {
    // Check meeting type
    if (meeting.type && this.hasDevelopmentKeywords(meeting.type)) {
      return true;
    }

    // Check agenda items if available
    if (meeting.items && Array.isArray(meeting.items)) {
      return meeting.items.some((item: any) => 
        this.hasDevelopmentKeywords(item.title || item.description || '')
      );
    }

    // Check meeting name/title
    return this.hasDevelopmentKeywords(meeting.name || meeting.title || '');
  }

  private hasDevelopmentKeywords(text: string): boolean {
    const keywords = [
      'rezoning', 'rezone', 'site plan', 'subdivision', 
      'development', 'construction', 'building permit',
      'variance', 'special use', 'conditional use',
      'master plan', 'annexation', 'plat', 'PUD',
      'planned unit', 'mixed use', 'multi-family',
      'apartment', 'residential', 'commercial'
    ];

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }
}