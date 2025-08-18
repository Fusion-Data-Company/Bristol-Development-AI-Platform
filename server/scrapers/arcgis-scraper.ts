import { BaseScraper } from './base-scraper';
import { DatasetConfig } from '../config/competitor-config';

export class ArcGIScraper extends BaseScraper {
  private config: DatasetConfig;
  private baseUrl: string;

  constructor(jurisdiction: string, config: DatasetConfig) {
    super('ArcGIS Scraper', jurisdiction, config.label);
    this.config = config;
    this.baseUrl = config.url.replace('/MapServer/0', '');
  }

  async scrape(options?: { daysBack?: number }): Promise<{ recordsFound: number; recordsNew: number }> {
    const daysBack = options?.daysBack || 30;
    await this.startJob({ daysBack });

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Build query URL
      const queryUrl = `${this.config.url}/query`;
      const params = new URLSearchParams({
        where: this.buildWhereClause(startDate),
        outFields: '*',
        f: 'json',
        orderByFields: this.config.dateField || 'OBJECTID DESC',
        resultRecordCount: '1000'
      });

      console.log(`🔍 Scraping ${this.config.label} for ${this.jurisdiction}`);
      
      const response = await fetch(`${queryUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.features) {
        console.log('No features found in response');
        await this.completeJob(0, 0);
        return { recordsFound: 0, recordsNew: 0 };
      }

      let recordsFound = 0;
      let recordsNew = 0;

      for (const feature of data.features) {
        const attrs = feature.attributes;
        recordsFound++;

        // Check if this is a significant permit
        if (!this.isSignificantPermit(attrs)) {
          continue;
        }

        // Save the signal
        await this.saveSignal({
          type: 'permit',
          sourceId: String(attrs.OBJECTID || attrs.objectid || attrs.id),
          title: this.buildTitle(attrs),
          address: this.extractAddress(attrs),
          whenIso: this.extractDate(attrs),
          link: this.buildPermitLink(attrs),
          rawData: attrs,
          priority: this.calculatePriority(attrs)
        });

        recordsNew++;
      }

      console.log(`✅ Found ${recordsFound} records, ${recordsNew} new signals`);
      await this.completeJob(recordsFound, recordsNew);
      return { recordsFound, recordsNew };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ArcGIS scraper error: ${errorMsg}`);
      await this.failJob(errorMsg);
      throw error;
    }
  }

  private buildWhereClause(startDate: Date): string {
    if (this.config.dateField) {
      const dateStr = startDate.toISOString().split('T')[0];
      return `${this.config.dateField} >= '${dateStr}'`;
    }
    return '1=1';
  }

  private isSignificantPermit(attrs: any): boolean {
    // Check for multi-family or commercial keywords
    const significantTypes = [
      'multi', 'apartment', 'condo', 'townhome', 'mixed',
      'commercial', 'office', 'retail', 'industrial'
    ];

    const permitType = String(attrs.permit_type || attrs.type || '').toLowerCase();
    const description = String(attrs.description || attrs.work_description || '').toLowerCase();
    const occupancy = String(attrs.occupancy || '').toLowerCase();

    // Check if it's a significant type
    const isSignificant = significantTypes.some(type => 
      permitType.includes(type) || 
      description.includes(type) || 
      occupancy.includes(type)
    );

    // Also check construction value if available
    const value = attrs.estimated_cost || attrs.construction_value || attrs.valuation;
    if (value && parseFloat(value) > 500000) {
      return true;
    }

    return isSignificant;
  }

  private buildTitle(attrs: any): string {
    if (this.config.titleTemplate) {
      return this.config.titleTemplate.replace(/\${(\w+)}/g, (match, key) => {
        return attrs[key] || '';
      });
    }

    const type = attrs.permit_type || attrs.type || 'Permit';
    const desc = attrs.description || attrs.work_description || '';
    return `${type}: ${desc}`.slice(0, 200);
  }

  private extractAddress(attrs: any): string {
    const addressField = this.config.addressField || 'address';
    const address = attrs[addressField] || attrs.site_address || attrs.location || '';
    return this.normalizeAddress(address);
  }

  private extractDate(attrs: any): Date {
    const dateField = this.config.dateField || 'date_entered';
    const dateValue = attrs[dateField] || attrs.created_date || attrs.issue_date;
    return this.parseDate(dateValue);
  }

  private buildPermitLink(attrs: any): string | null {
    const permitId = attrs.permit_number || attrs.OBJECTID;
    if (!permitId) return null;

    // Try to build a link to the permit detail page
    if (this.jurisdiction.includes('nashville')) {
      return `https://www.nashville.gov/permits/permit-${permitId}`;
    }
    
    return null;
  }

  private calculatePriority(attrs: any): number {
    let priority = 5; // Base priority

    // Increase priority for large projects
    const value = attrs.estimated_cost || attrs.construction_value;
    if (value) {
      const numValue = parseFloat(value);
      if (numValue > 10000000) priority = 9;
      else if (numValue > 5000000) priority = 8;
      else if (numValue > 1000000) priority = 7;
    }

    // Increase priority for multi-family
    const description = String(attrs.description || '').toLowerCase();
    if (description.includes('multi') || description.includes('apartment')) {
      priority = Math.max(priority, 8);
    }

    return priority;
  }
}