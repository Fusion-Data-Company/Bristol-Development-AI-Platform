import { Router } from 'express';
import { Client } from '@microsoft/microsoft-graph-client';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Check if Microsoft 365 is configured
const isConfigured = () => {
  return !!(
    process.env.MS_CLIENT_ID &&
    process.env.MS_CLIENT_SECRET &&
    process.env.MS_TENANT_ID
  );
};

// Get OAuth URL for Microsoft 365
router.get('/oauth/url', (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      message: 'Microsoft 365 integration not configured',
      configured: false
    });
  }

  const clientId = process.env.MS_CLIENT_ID;
  const tenantId = process.env.MS_TENANT_ID || 'common';
  const redirectUri = process.env.MS_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/microsoft/oauth/callback`;
  
  const scopes = encodeURIComponent('user.read files.read mail.read');
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_mode=query`;

  res.json({ url: authUrl, configured: true });
});

// OAuth callback handler
router.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code || !isConfigured()) {
    return res.redirect('/?error=invalid_request');
  }

  try {
    // Exchange code for token
    const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_TENANT_ID || 'common'}/oauth2/v2.0/token`;
    const redirectUri = process.env.MS_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/microsoft/oauth/callback`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID!,
        client_secret: process.env.MS_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in session (simplified - in production, store encrypted in database)
    (req as any).session.msToken = tokenData.access_token;
    
    res.redirect('/?microsoft=connected');
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    res.redirect('/?error=oauth_failed');
  }
});

// List OneDrive root files
router.get('/onedrive/root', isAuthenticated, async (req: any, res) => {
  if (!isConfigured()) {
    return res.json({
      configured: false,
      message: 'Microsoft 365 not configured. Please add MS_CLIENT_ID, MS_CLIENT_SECRET, and MS_TENANT_ID to environment variables.'
    });
  }

  const token = req.session?.msToken;
  if (!token) {
    return res.status(401).json({
      message: 'Not authenticated with Microsoft. Please connect your Microsoft account first.'
    });
  }

  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, token);
      }
    });

    const result = await client
      .api('/me/drive/root/children')
      .top(10)
      .select('name,size,lastModifiedDateTime,webUrl')
      .get();

    res.json({
      configured: true,
      files: result.value
    });
  } catch (error: any) {
    console.error('OneDrive error:', error);
    res.status(500).json({
      message: 'Failed to list OneDrive files',
      error: error.message
    });
  }
});

// List 10 recent emails
router.get('/mail/recent', isAuthenticated, async (req: any, res) => {
  if (!isConfigured()) {
    return res.json({
      configured: false,
      message: 'Microsoft 365 not configured. Please add MS_CLIENT_ID, MS_CLIENT_SECRET, and MS_TENANT_ID to environment variables.'
    });
  }

  const token = req.session?.msToken;
  if (!token) {
    return res.status(401).json({
      message: 'Not authenticated with Microsoft. Please connect your Microsoft account first.'
    });
  }

  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, token);
      }
    });

    const result = await client
      .api('/me/messages')
      .top(10)
      .select('subject,from,receivedDateTime,bodyPreview')
      .orderby('receivedDateTime desc')
      .get();

    res.json({
      configured: true,
      emails: result.value
    });
  } catch (error: any) {
    console.error('Mail error:', error);
    res.status(500).json({
      message: 'Failed to list emails',
      error: error.message
    });
  }
});

// Check connection status
router.get('/status', isAuthenticated, async (req: any, res) => {
  const configured = isConfigured();
  const connected = !!req.session?.msToken;
  
  res.json({
    configured,
    connected,
    message: !configured 
      ? 'Microsoft 365 not configured. Add MS_CLIENT_ID, MS_CLIENT_SECRET, and MS_TENANT_ID to environment variables.'
      : !connected 
      ? 'Not connected. Please authenticate with Microsoft 365.'
      : 'Connected and ready'
  });
});

export default router;