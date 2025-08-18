import { storage } from '../storage';
import { JURISDICTIONS, COMPETITOR_ENTITIES, SEC_CIKS } from '../config/competitor-config';
import { ArcGIScraper } from '../scrapers/arcgis-scraper';
import { SECEdgarScraper } from '../scrapers/sec-scraper';
import { AgendaScraper } from '../scrapers/agenda-scraper';
import { PerplexitySonarService } from './perplexitySonarService';

export class CompetitorWatchService {
  private perplexityService: PerplexitySonarService;
  private isRunning: boolean = false;

  constructor() {
    this.perplexityService = new PerplexitySonarService();
  }

  /**
   * Run a full competitor watch cycle
   */
  async runFullCycle(options?: { daysBack?: number }): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Competitor watch is already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    console.log('🚀 Starting Competitor Watch cycle');
    console.log(`📅 Looking back ${options?.daysBack || 30} days`);

    try {
      // 1. Initialize jurisdictions and entities in database
      await this.initializeDatabase();

      // 2. Scrape all data sources
      const scrapeResults = await this.scrapeAllSources(options);

      // 3. Analyze signals with AI
      await this.analyzeSignals();

      // 4. Generate summary report
      const report = await this.generateReport(scrapeResults);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Competitor Watch cycle complete in ${duration}s`);
      console.log(report);

    } catch (error) {
      console.error('❌ Competitor Watch cycle failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Initialize database with jurisdictions and entities
   */
  private async initializeDatabase(): Promise<void> {
    console.log('📊 Initializing database...');

    // Upsert jurisdictions
    for (const jurisdiction of JURISDICTIONS) {
      const existing = await storage.getGeoJurisdiction(jurisdiction.key);
      if (!existing) {
        await storage.createGeoJurisdiction({
          key: jurisdiction.key,
          label: jurisdiction.label,
          state: jurisdiction.state,
          active: jurisdiction.active !== false,
          config: jurisdiction,
          scrapeFrequency: jurisdiction.scrapeFrequency || 360
        });
        console.log(`✅ Created jurisdiction: ${jurisdiction.label}`);
      }
    }

    // Upsert competitor entities
    for (const entity of COMPETITOR_ENTITIES) {
      const existing = await storage.getCompetitorEntities();
      const found = existing.find(e => e.name === entity.name);
      
      if (!found) {
        await storage.createCompetitorEntity({
          name: entity.name,
          type: entity.type as 'company' | 'person',
          keywords: entity.keywords,
          cik: (entity as any).cik || null,
          active: true
        });
        console.log(`✅ Created competitor entity: ${entity.name}`);
      }
    }
  }

  /**
   * Scrape all configured data sources
   */
  private async scrapeAllSources(options?: { daysBack?: number }): Promise<any> {
    const results = {
      permits: { total: 0, new: 0 },
      agendas: { total: 0, new: 0 },
      sec: { total: 0, new: 0 },
      total: { total: 0, new: 0 }
    };

    // Scrape permits from ArcGIS
    for (const jurisdiction of JURISDICTIONS) {
      if (!jurisdiction.active || !jurisdiction.datasets) continue;

      for (const dataset of jurisdiction.datasets) {
        if (dataset.type === 'arcgis') {
          try {
            const scraper = new ArcGIScraper(jurisdiction.key, dataset);
            const result = await scraper.scrape(options);
            results.permits.total += result.recordsFound;
            results.permits.new += result.recordsNew;
          } catch (error) {
            console.error(`Failed to scrape ${dataset.label}:`, error);
          }
        }
      }
    }

    // Scrape planning agendas
    for (const jurisdiction of JURISDICTIONS) {
      if (!jurisdiction.active || !jurisdiction.agendas) continue;

      for (const agenda of jurisdiction.agendas) {
        try {
          const scraper = new AgendaScraper(jurisdiction.key, agenda);
          const result = await scraper.scrape(options);
          results.agendas.total += result.recordsFound;
          results.agendas.new += result.recordsNew;
        } catch (error) {
          console.error(`Failed to scrape ${agenda.label}:`, error);
        }
      }
    }

    // Scrape SEC filings
    if (SEC_CIKS.length > 0) {
      try {
        const secScraper = new SECEdgarScraper();
        const result = await secScraper.scrape(options);
        results.sec.total += result.recordsFound;
        results.sec.new += result.recordsNew;
      } catch (error) {
        console.error('Failed to scrape SEC:', error);
      }
    }

    // Calculate totals
    results.total.total = results.permits.total + results.agendas.total + results.sec.total;
    results.total.new = results.permits.new + results.agendas.new + results.sec.new;

    return results;
  }

  /**
   * Analyze unprocessed signals with AI
   */
  private async analyzeSignals(): Promise<void> {
    console.log('🤖 Analyzing signals with AI...');

    // Get unanalyzed signals
    const signals = await storage.getCompetitorSignals({ limit: 100 });
    const unanalyzed = signals.filter(s => !s.analyzed);

    if (unanalyzed.length === 0) {
      console.log('No new signals to analyze');
      return;
    }

    console.log(`Analyzing ${unanalyzed.length} signals...`);

    for (const signal of unanalyzed) {
      try {
        // Skip if no competitor match
        if (!signal.competitorMatch) {
          await storage.updateCompetitorSignal(signal.id, { analyzed: true });
          continue;
        }

        // Generate analysis with Perplexity Sonar
        const analysis = await this.perplexityService.analyzeCompetitorSignal(signal);

        if (analysis) {
          // Save analysis
          await storage.createCompetitorAnalysis({
            signalId: signal.id,
            competitorId: signal.competitorMatch,
            analysis: analysis.analysis,
            impact: analysis.impact,
            confidence: analysis.confidence,
            recommendations: analysis.recommendations
          });

          // Mark signal as analyzed
          await storage.updateCompetitorSignal(signal.id, { 
            analyzed: true,
            confidence: analysis.confidence
          });

          console.log(`✅ Analyzed signal: ${signal.title}`);
        }

      } catch (error) {
        console.error(`Failed to analyze signal ${signal.id}:`, error);
      }
    }
  }

  /**
   * Generate summary report
   */
  private async generateReport(scrapeResults: any): Promise<string> {
    const recentSignals = await storage.getRecentSignals(7);
    const competitorSignals = recentSignals.filter(s => s.competitorMatch);
    
    const competitorCounts: Record<string, number> = {};
    for (const signal of competitorSignals) {
      if (signal.competitorMatch) {
        competitorCounts[signal.competitorMatch] = (competitorCounts[signal.competitorMatch] || 0) + 1;
      }
    }

    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return `
📊 COMPETITOR WATCH REPORT
========================

📈 Scraping Results:
- Permits: ${scrapeResults.permits.new} new / ${scrapeResults.permits.total} total
- Agendas: ${scrapeResults.agendas.new} new / ${scrapeResults.agendas.total} total  
- SEC Filings: ${scrapeResults.sec.new} new / ${scrapeResults.sec.total} total
- TOTAL: ${scrapeResults.total.new} new signals

🎯 Competitor Activity (Last 7 Days):
- Total Signals: ${recentSignals.length}
- With Competitor Match: ${competitorSignals.length}

🏆 Top Active Competitors:
${topCompetitors.map(([name, count]) => `  • ${name}: ${count} signals`).join('\n')}

📍 Jurisdictions Monitored: ${JURISDICTIONS.filter(j => j.active).length}
🏢 Competitors Tracked: ${COMPETITOR_ENTITIES.length}
    `;
  }

  /**
   * Get competitor dashboard data
   */
  async getDashboardData(): Promise<any> {
    const [
      recentSignals,
      jurisdictions,
      competitors,
      recentAnalyses
    ] = await Promise.all([
      storage.getRecentSignals(7),
      storage.getGeoJurisdictions(true),
      storage.getCompetitorEntities(true),
      storage.getCompetitorAnalyses(undefined, 10)
    ]);

    // Group signals by type
    const signalsByType: Record<string, number> = {};
    const signalsByJurisdiction: Record<string, number> = {};
    const signalsByCompetitor: Record<string, number> = {};

    for (const signal of recentSignals) {
      signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1;
      signalsByJurisdiction[signal.jurisdiction] = (signalsByJurisdiction[signal.jurisdiction] || 0) + 1;
      if (signal.competitorMatch) {
        signalsByCompetitor[signal.competitorMatch] = (signalsByCompetitor[signal.competitorMatch] || 0) + 1;
      }
    }

    // Get high priority signals
    const highPrioritySignals = recentSignals
      .filter(s => s.priority && s.priority >= 7)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 10);

    return {
      summary: {
        totalSignals: recentSignals.length,
        competitorMatches: recentSignals.filter(s => s.competitorMatch).length,
        highPriority: highPrioritySignals.length,
        jurisdictionsActive: jurisdictions.length,
        competitorsTracked: competitors.length
      },
      signalsByType,
      signalsByJurisdiction,
      signalsByCompetitor,
      highPrioritySignals,
      recentAnalyses,
      competitors: competitors.slice(0, 10),
      jurisdictions
    };
  }
}

// Export singleton instance
export const competitorWatchService = new CompetitorWatchService();