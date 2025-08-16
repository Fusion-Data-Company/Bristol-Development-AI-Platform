import { AuthForm } from "@/components/ui/sign-in";
import Chrome from "@/components/brand/SimpleChrome";

export default function Landing() {
  const handleSocialSignIn = (provider: string) => {
    console.log(`Signing in with ${provider}...`);
    // REPLIT AUTH FLOW:
    // 1. All login buttons redirect to /api/login
    // 2. Our backend (replitAuth.ts) redirects to Replit's auth page
    // 3. Replit shows their login UI with Google, GitHub, X, Apple, Email options
    // 4. User chooses provider and logs in
    // 5. Replit redirects back to our /api/callback with user info
    // 6. We create/update user in our database and establish session
    // Note: We don't need separate endpoints for each provider - Replit handles that!
    window.location.href = "/api/login";
  }

  const handleEmailSubmit = (data: { email: string; password?: string }) => {
    console.log("Form submitted:", data);
    // Replit Auth handles email/password authentication
    // Redirect to the login endpoint which will handle the authentication flow
    window.location.href = "/api/login";
  }
  
  const handleEmailLink = () => {
    console.log("Requesting email link...");
    // Email magic link also handled by Replit Auth
    window.location.href = "/api/login";
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Main Stucco Background with Enhanced Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800" 
           style={{
             backgroundImage: `
               repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255, 255, 255, 0.15) 3px, rgba(255, 255, 255, 0.15) 6px),
               repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0, 0, 0, 0.1) 3px, rgba(0, 0, 0, 0.1) 6px),
               repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.08) 3deg, transparent 6deg),
               radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.1) 0%, transparent 50%)
             `,
             backgroundSize: '8px 8px, 8px 8px, 24px 24px, 100px 100px, 150px 150px'
           }}>
      </div>

      {/* Animated Moving Layer 1 - Cyan Glows */}
      <div className="absolute inset-0 animate-pulse" 
           style={{
             backgroundImage: `
               radial-gradient(circle at 15% 30%, rgba(6, 182, 212, 0.4) 0%, transparent 40%),
               radial-gradient(circle at 85% 60%, rgba(6, 182, 212, 0.3) 0%, transparent 45%),
               radial-gradient(circle at 50% 90%, rgba(6, 182, 212, 0.25) 0%, transparent 35%)
             `,
             backgroundSize: '600px 600px, 800px 800px, 500px 500px',
             animation: 'float-cyan 8s ease-in-out infinite'
           }}>
      </div>

      {/* Animated Moving Layer 2 - Orange Glows */}
      <div className="absolute inset-0" 
           style={{
             backgroundImage: `
               radial-gradient(circle at 70% 20%, rgba(255, 165, 0, 0.35) 0%, transparent 40%),
               radial-gradient(circle at 30% 70%, rgba(255, 140, 0, 0.3) 0%, transparent 45%),
               radial-gradient(circle at 90% 80%, rgba(255, 165, 0, 0.25) 0%, transparent 35%)
             `,
             backgroundSize: '700px 700px, 600px 600px, 550px 550px',
             animation: 'float-orange 10s ease-in-out infinite reverse'
           }}>
      </div>

      {/* Animated Moving Layer 3 - Mixed Glows */}
      <div className="absolute inset-0" 
           style={{
             backgroundImage: `
               radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 80% 30%, rgba(255, 165, 0, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 40%)
             `,
             backgroundSize: '900px 900px, 750px 750px, 650px 650px',
             animation: 'drift 12s linear infinite'
           }}>
      </div>

      {/* Advanced Stucco Texture Overlay */}
      <div className="absolute inset-0" 
           style={{
             backgroundImage: `
               repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.08) 1px, rgba(255, 255, 255, 0.08) 2px),
               repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.05) 1px, rgba(0, 0, 0, 0.05) 2px),
               repeating-radial-gradient(circle at 50% 50%, transparent 0px, rgba(255, 255, 255, 0.03) 1px, transparent 2px)
             `,
             backgroundSize: '3px 3px, 3px 3px, 15px 15px'
           }}>
      </div>

      {/* Dynamic Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-gray-700/10"></div>

      
      {/* Main Content with Chrome wrapper for perfect header/footer */}
      <div className="relative z-10">
        <Chrome showNavigation={false}>
          <div className="min-h-[calc(100vh-400px)] flex items-center justify-center py-16">
            <AuthForm 
              onSocialSignIn={handleSocialSignIn}
              onEmailSubmit={handleEmailSubmit}
              onEmailLink={handleEmailLink}
              className="shadow-2xl backdrop-blur-sm bg-white/95 border-2 border-cyan-200/30"
            />
          </div>
        </Chrome>
      </div>
    </div>
  );
}