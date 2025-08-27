import { storage } from "../storage";
import type { Site, SiteMetric, Comp, Property } from "@shared/schema";

export interface AppDataContext {
  sites: Site[];
  siteMetrics: Record<string, SiteMetric[]>;
  properties: Property[];
  comps: Record<string, Comp[]>;
  analytics: {
    totalSites: number;
    totalUnits: number;
    avgUnitsPerSite: number;
    completionYears: Record<number, number>;
    stateDistribution: Record<string, number>;
  };
  tools: {
    bls: any[];
    bea: any[];
    hud: any[];
    foursquare: any[];
    fbi: any[];
    noaa: any[];
  };
  snapshots: any[];
  timestamp: string;
}

/**
 * Comprehensive data aggregation service for Real Estate Intelligence AI.
 * Pulls all available data from APIs, database, and tools
 */
class DataAggregationService {
  
  /**
   * Get complete application data context for AI
   */
  async getCompleteAppData(userId?: string): Promise<AppDataContext> {
    try {
      // Get all sites and related data
      const sites = await storage.getAllSites();
      const properties: Property[] = []; // Properties table is empty, using sites instead
      const snapshots = await storage.getUserSnapshots(userId || "demo-user");
      
      // Get site metrics for each site
      const siteMetrics: Record<string, SiteMetric[]> = {};
      const comps: Record<string, Comp[]> = {};
      
      for (const site of sites) {
        // Get metrics for this site
        try {
          const metrics = await storage.getSiteMetrics(site.id);
          if (metrics.length > 0) {
            siteMetrics[site.id] = metrics;
          }
        } catch (error) {
          console.log(`No metrics found for site ${site.id}`);
        }
        
        // Get comps for this site (placeholder - comps not yet implemented in storage)
        // TODO: Implement comps in storage interface
        comps[site.id] = [];
      }
      
      // Calculate analytics
      const analytics = this.calculateAnalytics(sites);
      
      // Get recent tool data from snapshots
      const tools = this.extractToolData(snapshots);
      
      return {
        sites,
        siteMetrics,
        properties,
        comps,
        analytics,
        tools,
        snapshots: snapshots.slice(0, 10), // Last 10 snapshots
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error("Error aggregating app data:", error);
      return {
        sites: [],
        siteMetrics: {},
        properties: [],
        comps: {},
        analytics: {
          totalSites: 0,
          totalUnits: 0,
          avgUnitsPerSite: 0,
          completionYears: {},
          stateDistribution: {}
        },
        tools: {
          bls: [],
          bea: [],
          hud: [],
          foursquare: [],
          fbi: [],
          noaa: []
        },
        snapshots: [],
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Calculate portfolio analytics
   */
  private calculateAnalytics(sites: Site[]) {
    const analytics = {
      totalSites: sites.length,
      totalUnits: 0,
      avgUnitsPerSite: 0,
      completionYears: {} as Record<number, number>,
      stateDistribution: {} as Record<string, number>
    };
    
    sites.forEach(site => {
      // Count units
      if (site.unitsTotal) {
        analytics.totalUnits += site.unitsTotal;
      }
      
      // Track completion years
      if (site.completionYear) {
        analytics.completionYears[site.completionYear] = 
          (analytics.completionYears[site.completionYear] || 0) + 1;
      }
      
      // Track state distribution
      if (site.state) {
        analytics.stateDistribution[site.state] = 
          (analytics.stateDistribution[site.state] || 0) + 1;
      }
    });
    
    analytics.avgUnitsPerSite = analytics.totalSites > 0 
      ? Math.round(analytics.totalUnits / analytics.totalSites) 
      : 0;
    
    return analytics;
  }
  
  /**
   * Extract and organize tool data from snapshots
   */
  private extractToolData(snapshots: any[]) {
    const tools = {
      bls: [] as any[],
      bea: [] as any[],
      hud: [] as any[],
      foursquare: [] as any[],
      fbi: [] as any[],
      noaa: [] as any[]
    };
    
    snapshots.forEach(snapshot => {
      if (snapshot.tool && tools.hasOwnProperty(snapshot.tool)) {
        tools[snapshot.tool as keyof typeof tools].push({
          params: snapshot.params,
          data: snapshot.data,
          createdAt: snapshot.createdAt
        });
      }
    });
    
    return tools;
  }
  
  /**
   * Get data for specific geographic area
   */
  async getAreaData(state?: string, city?: string): Promise<any> {
    const sites = await storage.getAllSites();
    
    let filteredSites = sites;
    if (state) {
      filteredSites = filteredSites.filter(s => s.state === state);
    }
    if (city) {
      filteredSites = filteredSites.filter(s => s.city === city);
    }
    
    return {
      sites: filteredSites,
      analytics: this.calculateAnalytics(filteredSites),
      area: { state, city }
    };
  }
  
  /**
   * Get recent market data summary
   */
  async getMarketSummary(): Promise<any> {
    const appData = await this.getCompleteAppData();
    
    return {
      portfolio: {
        totalSites: appData.analytics.totalSites,
        totalUnits: appData.analytics.totalUnits,
        keyMarkets: Object.entries(appData.analytics.stateDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      },
      recentData: {
        latestSnapshots: appData.snapshots.slice(0, 5),
        activeSites: appData.sites.filter(s => s.status === "Operating").length,
        pipelineSites: appData.sites.filter(s => s.status === "Pipeline").length
      }
    };
  }
}

export const dataAggregationService = new DataAggregationService();