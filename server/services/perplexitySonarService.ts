import { CompetitorSignal } from '@shared/schema-competitor';

export interface CompetitorAnalysisResult {
  analysis: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
}

export class PerplexitySonarService {
  private apiKey: string | undefined;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
  }

  /**
   * Analyze a competitor signal using Perplexity Sonar Deep Research
   */
  async analyzeCompetitorSignal(signal: CompetitorSignal): Promise<CompetitorAnalysisResult | null> {
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured - skipping AI analysis');
      return null;
    }

    try {
      const prompt = this.buildAnalysisPrompt(signal);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://bristol-development.com',
          'X-Title': 'Bristol Competitor Watch'
        },
        body: JSON.stringify({
          model: 'perplexity/sonar-deep-research',
          messages: [
            {
              role: 'system',
              content: 'You are a real estate market intelligence analyst for Bristol Development Group. Analyze competitor activities and provide strategic insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Perplexity API error:', error);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        console.error('No content in Perplexity response');
        return null;
      }

      return this.parseAnalysisResponse(content);

    } catch (error) {
      console.error('Error analyzing with Perplexity:', error);
      return null;
    }
  }

  /**
   * Research a competitor entity
   */
  async researchCompetitor(name: string, keywords: string[]): Promise<any> {
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured');
      return null;
    }

    try {
      const prompt = `Research the real estate development company "${name}". 
        Include:
        1. Recent projects and developments (last 12 months)
        2. Markets they are active in
        3. Development strategy and focus areas
        4. Recent acquisitions or partnerships
        5. Financial performance if publicly available
        6. Key executives and leadership changes
        
        Keywords to search: ${keywords.join(', ')}`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://bristol-development.com',
          'X-Title': 'Bristol Competitor Research'
        },
        body: JSON.stringify({
          model: 'perplexity/sonar-deep-research',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Perplexity API error:', error);
        return null;
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;

    } catch (error) {
      console.error('Error researching competitor:', error);
      return null;
    }
  }

  /**
   * Get market insights for a jurisdiction
   */
  async getMarketInsights(jurisdiction: string, state: string): Promise<any> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const prompt = `Provide current real estate development market insights for ${jurisdiction}, ${state}.
        Include:
        1. Recent major development projects announced or completed
        2. Market trends and growth indicators
        3. Regulatory changes affecting development
        4. Economic factors impacting the market
        5. Competitive landscape and major players
        
        Focus on multi-family residential and mixed-use developments.
        Time frame: Last 3 months`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://bristol-development.com',
          'X-Title': 'Bristol Market Insights'
        },
        body: JSON.stringify({
          model: 'perplexity/sonar-deep-research',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;

    } catch (error) {
      console.error('Error getting market insights:', error);
      return null;
    }
  }

  private buildAnalysisPrompt(signal: CompetitorSignal): string {
    const signalData = signal.rawData as any || {};
    
    let prompt = `Analyze this ${signal.type} signal for Bristol Development Group:

Competitor: ${signal.competitorMatch}
Type: ${signal.type}
Location: ${signal.jurisdiction}
Date: ${signal.whenIso}
Title: ${signal.title}
`;

    if (signal.address) {
      prompt += `Address: ${signal.address}\n`;
    }

    // Add type-specific details
    switch (signal.type) {
      case 'permit':
        prompt += `
Permit Details:
- Type: ${signalData.permit_type || 'Unknown'}
- Description: ${signalData.description || signalData.work_description || 'N/A'}
- Value: ${signalData.estimated_cost || signalData.construction_value || 'Unknown'}
- Occupancy: ${signalData.occupancy || 'Unknown'}
`;
        break;

      case 'sec_filing':
        prompt += `
Filing Details:
- Filing Type: ${signalData.filingType}
- Company: ${signalData.companyName}
- CIK: ${signalData.cik}
`;
        break;

      case 'agenda':
        prompt += `
Meeting: ${signal.title}
Link: ${signal.link || 'N/A'}
`;
        break;
    }

    prompt += `
Provide:
1. Strategic analysis of what this means for Bristol Development
2. Potential impact on Bristol's market position
3. Recommended actions Bristol should take
4. Confidence level in this assessment (0-1)

Format as JSON with fields: analysis, impact (low/medium/high/critical), confidence, recommendations (array)`;

    return prompt;
  }

  private parseAnalysisResponse(content: string): CompetitorAnalysisResult {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          analysis: parsed.analysis || content,
          impact: parsed.impact || 'medium',
          confidence: parsed.confidence || 0.5,
          recommendations: parsed.recommendations || []
        };
      }
    } catch {}

    // Fallback to text parsing
    const impactMatch = content.match(/impact[:\s]*(low|medium|high|critical)/i);
    const confidenceMatch = content.match(/confidence[:\s]*([\d.]+)/i);

    return {
      analysis: content,
      impact: (impactMatch?.[1] as any) || 'medium',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
      recommendations: this.extractRecommendations(content)
    };
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    
    // Look for numbered recommendations
    const numberedMatches = content.match(/\d+\.\s*([^\n]+)/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        const cleaned = match.replace(/^\d+\.\s*/, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      });
    }

    // Look for bullet points
    const bulletMatches = content.match(/[•\-\*]\s*([^\n]+)/g);
    if (bulletMatches) {
      bulletMatches.forEach(match => {
        const cleaned = match.replace(/^[•\-\*]\s*/, '').trim();
        if (cleaned.length > 10 && !recommendations.includes(cleaned)) {
          recommendations.push(cleaned);
        }
      });
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}