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
    <div className="min-h-screen bg-gray-50">
      {/* GlobalHeader without navigation */}
      <GlobalHeader showNavigation={false} />
      
      {/* Main Content */}
      <div className="pt-20 min-h-[calc(100vh-80px)] flex items-center justify-center py-16">
        <AuthForm 
          onSocialSignIn={handleSocialSignIn}
          onEmailSubmit={handleEmailSubmit}
          onEmailLink={handleEmailLink}
          className="shadow-xl"
        />
      </div>
      
      {/* BristolFooter */}
      <BristolFooter variant="thick" />
    </div>
  );
}