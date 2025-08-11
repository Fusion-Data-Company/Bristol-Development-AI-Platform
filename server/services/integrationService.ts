import { storage } from "../storage";
import type { InsertIntegrationLog } from "@shared/schema";

interface Microsoft365Config {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

interface ApifyConfig {
  token: string;
}

export class IntegrationService {
  private microsoft365Config: Microsoft365Config | null = null;
  private apifyConfig: ApifyConfig | null = null;

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Microsoft 365 configuration
    if (process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      this.microsoft365Config = {
        tenantId: process.env.MICROSOFT_TENANT_ID,
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET
      };
    }

    // Apify configuration
    if (process.env.APIFY_TOKEN) {
      this.apifyConfig = {
        token: process.env.APIFY_TOKEN
      };
    }
  }

  async testMicrosoft365Connection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.microsoft365Config) {
      return { connected: false, error: "Microsoft 365 not configured" };
    }

    try {
      // Attempt to get an access token
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${this.microsoft365Config.tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.microsoft365Config.clientId,
          client_secret: this.microsoft365Config.clientSecret,
          scope: "https://graph.microsoft.com/.default"
        })
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      // Test a simple Graph API call
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });

      return { connected: graphResponse.ok };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection test failed" 
      };
    }
  }

  async testApifyConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.apifyConfig) {
      return { connected: false, error: "Apify not configured" };
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/users/me?token=${this.apifyConfig.token}`);
      
      if (!response.ok) {
        throw new Error(`Apify API test failed: ${response.status}`);
      }

      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection test failed" 
      };
    }
  }

  async testN8nConnection(): Promise<{ connected: boolean; error?: string }> {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      return { connected: false, error: "N8N_WEBHOOK_URL not configured" };
    }

    try {
      // Test with a ping endpoint if available, otherwise just check if URL is reachable
      const testUrl = `${n8nWebhookUrl}/ping`;
      const response = await fetch(testUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return { connected: response.ok };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection test failed" 
      };
    }
  }

  async testArcGISConnection(): Promise<{ connected: boolean; error?: string }> {
    const arcgisApiKey = process.env.ARCGIS_API_KEY;
    
    if (!arcgisApiKey) {
      return { connected: false, error: "ARCGIS_API_KEY not configured" };
    }

    try {
      // Test ArcGIS REST API
      const response = await fetch(`https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json&token=${arcgisApiKey}&resultRecordCount=1`);
      
      if (!response.ok) {
        throw new Error(`ArcGIS API test failed: ${response.status}`);
      }

      const data = await response.json();
      return { connected: !data.error };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection test failed" 
      };
    }
  }

  async getIntegrationStatus() {
    const [microsoft365, apify, n8n, arcgis] = await Promise.all([
      this.testMicrosoft365Connection(),
      this.testApifyConnection(),
      this.testN8nConnection(),
      this.testArcGISConnection()
    ]);

    return {
      microsoft365,
      apify,
      n8n,
      arcgis,
      lastChecked: new Date().toISOString()
    };
  }

  async logIntegrationEvent(
    service: string,
    action: string,
    payload?: any,
    response?: any,
    status: "success" | "error" | "pending" = "success",
    error?: string,
    userId?: string
  ) {
    const logData: InsertIntegrationLog = {
      service,
      action,
      payload,
      response,
      status,
      error,
      userId
    };

    return await storage.createIntegrationLog(logData);
  }

  // Microsoft 365 specific methods
  async uploadToOneDrive(fileName: string, content: Buffer, userId: string): Promise<any> {
    if (!this.microsoft365Config) {
      throw new Error("Microsoft 365 not configured");
    }

    try {
      // Implementation would include proper Microsoft Graph API calls
      // This is a placeholder for the actual implementation
      
      await this.logIntegrationEvent(
        "microsoft365",
        "onedrive_upload",
        { fileName, size: content.length },
        { uploaded: true },
        "success",
        undefined,
        userId
      );

      return { success: true, fileName };
    } catch (error) {
      await this.logIntegrationEvent(
        "microsoft365",
        "onedrive_upload",
        { fileName },
        undefined,
        "error",
        error instanceof Error ? error.message : "Upload failed",
        userId
      );
      throw error;
    }
  }

  // Apify specific methods
  async runApifyActor(actorId: string, input: any, userId?: string): Promise<any> {
    if (!this.apifyConfig) {
      throw new Error("Apify not configured");
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${this.apifyConfig.token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Apify actor run failed: ${response.status}`);
      }

      const result = await response.json();

      await this.logIntegrationEvent(
        "apify",
        "run_actor",
        { actorId, input },
        result,
        "success",
        undefined,
        userId
      );

      return result;
    } catch (error) {
      await this.logIntegrationEvent(
        "apify",
        "run_actor",
        { actorId, input },
        undefined,
        "error",
        error instanceof Error ? error.message : "Actor run failed",
        userId
      );
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();
