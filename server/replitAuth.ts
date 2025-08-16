import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // PostgreSQL session store for persistent authentication
  const PgSession = connectPgSimple(session);
  
  return session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session', // Use default table name to avoid conflicts
      ttl: sessionTtl / 1000, // TTL in seconds for PostgreSQL
      createTableIfMissing: true,
      errorLog: (error: any) => {
        // Ignore index already exists errors
        if (error.code !== '42P07') {
          console.error('Session store error:', error);
        }
      },
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
    name: 'bristol.sid', // Custom session name to avoid conflicts
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      const email = claims?.email as string;
      
      console.log('🔐 OAuth verification started for email:', email);
      
      if (!claims || !email) {
        console.error('❌ Missing claims or email from OAuth provider');
        return verified(new Error('Invalid OAuth response - missing user information'), false);
      }
      
      // ACCESS CONTROL: Whitelist check
      const allowedEmails = [
        'rob@fusiondataco.com',
        'mat@fusiondataco.com',
        'theinsuranceschool@gmail.com',
        'samyeager@me.com',
        'yeager@bristoldevelopment.com'
      ];
      
      const allowedDomain = '@bristoldevelopment.com';
      
      // Check if user is authorized
      const emailLower = email.toLowerCase();
      const isAllowedEmail = allowedEmails.includes(emailLower);
      const isAllowedDomain = emailLower.endsWith(allowedDomain);
      
      // DEVELOPMENT ACCESS: In development mode, allow ALL authenticated users
      const isDevelopmentMode = process.env.NODE_ENV === 'development' || 
                                process.env.NODE_ENV !== 'production';
      
      if (isDevelopmentMode) {
        // In development, ANY authenticated user can access
        console.log('✅ Development mode access granted for:', email);
        console.log('Development environment detected - authentication bypassed for testing');
      } else if (!isAllowedEmail && !isAllowedDomain) {
        // In production, enforce whitelist strictly
        console.error('❌ Access denied for email:', email);
        return verified(new Error(`Access denied. Email ${email} is not authorized to access this application.`), false);
      }
      
      console.log('✅ Email authorized, creating/updating user...');
      
      const user = {};
      updateUserSession(user, tokens);
      
      // Add error handling around database operation
      await upsertUser(claims);
      
      console.log('✅ User upsert successful, authentication complete');
      verified(null, user);
      
    } catch (error) {
      console.error('❌ OAuth verification failed:', error);
      return verified(error as Error, false);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log('📥 OAuth callback received');
    
    passport.authenticate(`replitauth:${req.hostname}`, (err: Error, user: any, info: any) => {
      if (err || !user) {
        console.error('❌ Authentication failed:', err || 'No user returned');
        return res.redirect('/auth-error?reason=' + encodeURIComponent(err?.message || 'Authentication failed'));
      }
      
      // Manually establish the session
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('❌ Session creation failed:', loginErr);
          return res.redirect('/auth-error?reason=' + encodeURIComponent('Session creation failed'));
        }
        
        console.log('✅ User logged in successfully, session created');
        
        // Force session save before redirect
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('❌ Session save failed:', saveErr);
            return res.redirect('/auth-error?reason=' + encodeURIComponent('Session save failed'));
          }
          
          console.log('✅ Session saved successfully, redirecting to app');
          res.redirect('/');
        });
      });
    })(req, res, next);
  });
  
  // New auth error page endpoint
  app.get("/auth-error", (req, res) => {
    const reason = req.query.reason || 'Authentication failed';
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Error - Bristol Development AI Platform</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .error-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 { 
            margin-bottom: 1rem;
            font-size: 2rem;
          }
          .error-message {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 10px;
            margin: 1.5rem 0;
            font-family: monospace;
          }
          .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
          }
          button {
            background: white;
            color: #764ba2;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }
          button:hover {
            transform: translateY(-2px);
          }
          .info {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>🔐 Authentication Issue</h1>
          <p>We couldn't complete your sign-in to Bristol Development AI Platform.</p>
          <div class="error-message">${reason}</div>
          <div class="info">
            <p>📧 Authorized emails only:</p>
            <p>*@bristoldevelopment.com domain<br>
            or specific whitelisted accounts</p>
          </div>
          <div class="buttons">
            <button onclick="window.location.href='/api/login'">Try Again</button>
            <button onclick="clearAndRetry()">Clear Session & Retry</button>
          </div>
        </div>
        <script>
          function clearAndRetry() {
            fetch('/api/logout', { method: 'GET' })
              .then(() => {
                window.location.href = '/api/login';
              });
          }
        </script>
      </body>
      </html>
    `);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
  
  // Debug endpoint for auth status (helps diagnose issues)
  app.get("/api/auth/status", (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    const user = req.user as any;
    
    res.json({
      authenticated: isAuthenticated,
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      hasUser: !!user,
      userEmail: user?.claims?.email || null,
      userSub: user?.claims?.sub || null,
      expiresAt: user?.expires_at || null,
      timestamp: new Date().toISOString(),
      replitDomain: req.hostname,
      replitId: process.env.REPL_ID,
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
