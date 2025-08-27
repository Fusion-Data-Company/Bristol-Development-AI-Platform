import { BaseScraper } from './base-scraper';
import { SEC_CIKS } from '../config/competitor-config';
import { XMLParser } from 'fast-xml-parser';

export class SECEdgarScraper extends BaseScraper {
  private parser: XMLParser;

  constructor() {
    super('SEC EDGAR Scraper', 'SEC', 'SEC EDGAR');
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async scrape(options?: { daysBack?: number }): Promise<{ recordsFound: number; recordsNew: number }> {
    const daysBack = options?.daysBack || 7;
    await this.startJob({ daysBack, ciks: SEC_CIKS });

    let totalRecordsFound = 0;
    let totalRecordsNew = 0;

    try {
      for (const cik of SEC_CIKS) {
        console.log(`🔍 Scraping SEC filings for CIK: ${cik}`);
        
        const { recordsFound, recordsNew } = await this.scrapeCIK(cik, daysBack);
        totalRecordsFound += recordsFound;
        totalRecordsNew += recordsNew;
        
        // Rate limiting
        await this.delay(1000);
      }

      console.log(`✅ SEC scraping complete: ${totalRecordsFound} records, ${totalRecordsNew} new`);
      await this.completeJob(totalRecordsFound, totalRecordsNew);
      return { recordsFound: totalRecordsFound, recordsNew: totalRecordsNew };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ SEC scraper error: ${errorMsg}`);
      await this.failJob(errorMsg);
      throw error;
    }
  }

  private async scrapeCIK(cik: string, daysBack: number): Promise<{ recordsFound: number; recordsNew: number }> {
    try {
      // Get recent filings via EDGAR RSS feed
      const rssUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&start=0&count=40&output=atom`;
      
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Your Company Name Market Intelligence (contact@company.com)'
        }
      });

      if (!response.ok) {
        throw new Error(`SEC API error: ${response.status}`);
      }

      const xmlText = await response.text();
      const data = this.parser.parse(xmlText);
      
      const entries = data?.feed?.entry;
      if (!entries) {
        return { recordsFound: 0, recordsNew: 0 };
      }

      const entriesArray = Array.isArray(entries) ? entries : [entries];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      let recordsFound = 0;
      let recordsNew = 0;

      for (const entry of entriesArray) {
        const filingDate = new Date(entry.updated);
        if (filingDate < cutoffDate) continue;

        recordsFound++;

        // Extract filing details
        const filingType = this.extractFilingType(entry);
        const isSignificant = this.isSignificantFiling(filingType);
        
        if (!isSignificant) continue;

        // Get company name from the feed
        const companyName = entry.title?.split(' - ')[0] || 'Unknown Company';

        // Save the signal
        await this.saveSignal({
          type: 'sec_filing',
          sourceId: entry.id || `${cik}_${filingDate.getTime()}`,
          title: `${companyName}: ${filingType} Filing`,
          whenIso: filingDate,
          link: entry.link?.['@_href'] || entry.id,
          rawData: {
            cik,
            companyName,
            filingType,
            summary: entry.summary || entry.content,
            accessionNumber: this.extractAccessionNumber(entry)
          },
          priority: this.calculateFilingPriority(filingType),
          address: null
        });

        recordsNew++;
      }

      return { recordsFound, recordsNew };

    } catch (error) {
      console.error(`Error scraping CIK ${cik}:`, error);
      return { recordsFound: 0, recordsNew: 0 };
    }
  }

  private extractFilingType(entry: any): string {
    // Try to extract from category term
    if (entry.category?.['@_term']) {
      return entry.category['@_term'];
    }
    
    // Try to extract from title
    if (entry.title) {
      const match = entry.title.match(/\((.*?)\)/);
      if (match) return match[1];
    }

    // Try to extract from summary
    if (entry.summary) {
      const match = entry.summary.match(/Form Type: (.*?)$/m);
      if (match) return match[1];
    }

    return 'Unknown';
  }

  private extractAccessionNumber(entry: any): string | null {
    if (entry.id) {
      const match = entry.id.match(/accession-number=(\d+-\d+-\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  private isSignificantFiling(filingType: string): boolean {
    const significantTypes = [
      '8-K',  // Current report
      '10-Q', // Quarterly report
      '10-K', // Annual report
      'DEF 14A', // Proxy statement
      'S-1',  // Registration statement
      'S-3',  // Registration statement
      'S-4',  // Registration for M&A
      '424B', // Prospectus
      'SC 13D', // Beneficial ownership > 5%
      'SC 13G', // Beneficial ownership > 5% (passive)
      '13F',  // Institutional holdings
      'DEFA14A', // Additional proxy materials
      'PREM14A', // Preliminary proxy for merger
      'DEFM14A'  // Definitive proxy for merger
    ];

    return significantTypes.some(type => 
      filingType.toUpperCase().includes(type)
    );
  }

  private calculateFilingPriority(filingType: string): number {
    const upperType = filingType.toUpperCase();

    // High priority filings
    if (upperType.includes('8-K')) return 8;
    if (upperType.includes('S-1') || upperType.includes('S-3')) return 8;
    if (upperType.includes('SC 13')) return 8;
    if (upperType.includes('DEFM14A') || upperType.includes('PREM14A')) return 9;
    
    // Medium priority
    if (upperType.includes('10-Q') || upperType.includes('10-K')) return 6;
    if (upperType.includes('DEF 14A')) return 6;
    if (upperType.includes('424B')) return 7;
    
    // Default
    return 5;
  }
}