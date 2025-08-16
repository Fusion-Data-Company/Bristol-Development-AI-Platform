import { AuthForm } from "@/components/ui/sign-in";
import { GlobalHeader } from "@/components/GlobalHeader";
import { BristolFooter } from "@/components/BristolFooter";

export default function Landing() {
  const handleSocialSignIn = (provider: string) => {
    console.log(`Signing in with ${provider}...`);
    // All providers use the same Replit Auth endpoint
    // Replit will handle the actual provider selection
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
    <div className="min-h-screen relative">
      {/* Stucco Background with Visual Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300" 
           style={{
             backgroundImage: `
               repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255, 255, 255, 0.1) 1px, rgba(255, 255, 255, 0.1) 2px),
               repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(0, 0, 0, 0.05) 1px, rgba(0, 0, 0, 0.05) 2px),
               radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
               repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.03) 2deg, transparent 4deg)
             `,
             backgroundSize: '4px 4px, 4px 4px, 200% 200%, 300% 300%, 250% 250%, 20px 20px'
           }}>
      </div>
      
      {/* Overlay for texture depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-200/30 via-transparent to-gray-100/20"></div>
      
      {/* GlobalHeader without navigation */}
      <div className="relative z-10">
        <GlobalHeader showNavigation={false} />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 pt-20 min-h-[calc(100vh-80px)] flex items-center justify-center py-16">
        <AuthForm 
          onSocialSignIn={handleSocialSignIn}
          onEmailSubmit={handleEmailSubmit}
          onEmailLink={handleEmailLink}
          className="shadow-2xl backdrop-blur-sm bg-white/95 border-2 border-cyan-200/30"
        />
      </div>
      
      {/* BristolFooter */}
      <div className="relative z-10">
        <BristolFooter variant="thick" />
      </div>
    </div>
  );
}