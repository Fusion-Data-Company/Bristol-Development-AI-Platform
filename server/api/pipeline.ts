import { Router } from 'express';

const router = Router();

// ArcGIS FeatureServer proxy
router.get('/arcgis/*', async (req, res) => {
  try {
    const arcgisPath = req.params[0];
    const queryString = new URLSearchParams(req.query as any).toString();
    const arcgisUrl = `https://services.arcgis.com/${arcgisPath}${queryString ? '?' + queryString : ''}`;
    
    console.log('Proxying ArcGIS request to:', arcgisUrl);
    
    const response = await fetch(arcgisUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bristol AI Platform/1.0'
      }
    });

    if (!response.ok) {
      console.error('ArcGIS error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'ArcGIS service error',
        status: response.status,
        message: response.statusText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Pipeline proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy ArcGIS request',
      message: error.message
    });
  }
});

// Census Bureau proxy
router.get('/census/*', async (req, res) => {
  try {
    const censusPath = req.params[0];
    const queryString = new URLSearchParams(req.query as any).toString();
    const censusUrl = `https://api.census.gov/${censusPath}${queryString ? '?' + queryString : ''}`;
    
    console.log('Proxying Census request to:', censusUrl);
    
    const response = await fetch(censusUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bristol AI Platform/1.0'
      }
    });

    if (!response.ok) {
      console.error('Census error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Census service error',
        status: response.status,
        message: response.statusText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Census proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy Census request',
      message: error.message
    });
  }
});

// HUD proxy
router.get('/hud/*', async (req, res) => {
  try {
    const hudPath = req.params[0];
    const queryString = new URLSearchParams(req.query as any).toString();
    const hudUrl = `https://www.huduser.gov/hudapi/${hudPath}${queryString ? '?' + queryString : ''}`;
    
    console.log('Proxying HUD request to:', hudUrl);
    
    const response = await fetch(hudUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bristol AI Platform/1.0'
      }
    });

    if (!response.ok) {
      console.error('HUD error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'HUD service error',
        status: response.status,
        message: response.statusText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('HUD proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy HUD request',
      message: error.message
    });
  }
});

// Generic proxy for other services
router.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const options: RequestInit = {
      method,
      headers: {
        ...headers,
        'User-Agent': 'Bristol AI Platform/1.0'
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
    }

    const response = await fetch(url, options);
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.status(response.status).json({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    });
  } catch (error: any) {
    console.error('Generic proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request',
      message: error.message
    });
  }
});

export default router;