import { storage } from '../storage';
import { InsertCompetitorSignal, InsertScrapeJob } from '@shared/schema-competitor';
import { COMPETITOR_ENTITIES } from '../config/competitor-config';

export abstract class BaseScraper {
  protected name: string;
  protected jurisdiction: string;
  protected source: string;
  protected jobId?: string;

  constructor(name: string, jurisdiction: string, source: string) {
    this.name = name;
    this.jurisdiction = jurisdiction;
    this.source = source;
  }

  /**
   * Start a scrape job
   */
  async startJob(query?: any): Promise<string> {
    const job = await storage.createScrapeJob({
      status: 'running',
      source: this.source,
      query: query || {},
      startedAt: new Date()
    });
    this.jobId = job.id;
    return job.id;
  }

  /**
   * Complete a scrape job
   */
  async completeJob(recordsFound: number, recordsNew: number): Promise<void> {
    if (!this.jobId) return;
    
    await storage.updateScrapeJob(this.jobId, {
      status: 'done',
      finishedAt: new Date(),
      recordsFound,
      recordsNew,
      executionTime: Date.now() - (await storage.getScrapeJob(this.jobId))?.startedAt?.getTime()!
    });
  }

  /**
   * Fail a scrape job
   */
  async failJob(error: string): Promise<void> {
    if (!this.jobId) return;
    
    await storage.updateScrapeJob(this.jobId, {
      status: 'failed',
      finishedAt: new Date(),
      errorMessage: error
    });
  }

  /**
   * Save a signal to the database
   */
  async saveSignal(signal: Omit<InsertCompetitorSignal, 'source' | 'jurisdiction'>): Promise<void> {
    // Check for competitor matches
    const competitorMatch = this.detectCompetitor(
      signal.title + ' ' + (signal.address || '') + ' ' + JSON.stringify(signal.rawData)
    );

    await storage.createCompetitorSignal({
      ...signal,
      source: this.source,
      jurisdiction: this.jurisdiction,
      competitorMatch,
      confidence: competitorMatch ? 0.8 : null,
      analyzed: false
    });
  }

  /**
   * Detect if any known competitors are mentioned
   */
  protected detectCompetitor(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const entity of COMPETITOR_ENTITIES) {
      for (const keyword of entity.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return entity.name;
        }
      }
    }
    
    return null;
  }

  /**
   * Rate limiting helper
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract date from various formats
   */
  protected parseDate(dateStr: string | number | null | undefined): Date {
    if (!dateStr) return new Date();
    
    if (typeof dateStr === 'number') {
      // Unix timestamp
      return new Date(dateStr);
    }
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {}
    
    return new Date();
  }

  /**
   * Clean and normalize address
   */
  protected normalizeAddress(address: string | null | undefined): string {
    if (!address) return '';
    
    return address
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  }

  /**
   * Abstract method - must be implemented by each scraper
   */
  abstract scrape(options?: any): Promise<{ recordsFound: number; recordsNew: number }>;
}