import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { BristolFooter } from "@/components/BristolFooter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-bristol-fog font-sans relative overflow-x-hidden">
      {/* Parallax Background */}
      <ParallaxBackground />

      {/* Navigation Header - Grey with Bristol branding */}
      <header className="relative z-10 bg-bristol-ink text-white shadow-xl">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(218, 165, 32, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.12) 0%, transparent 50%)
          `
        }} />
        
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-bristol-maroon rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-serif font-bold text-2xl">B</span>
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-bristol-gold">Bristol Development</h1>
                <p className="text-bristol-stone text-base">Site Intelligence Platform</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-bristol-stone text-sm">Enterprise Access Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[80vh] py-16">
        <div className="w-full max-w-md mx-auto px-4">
          
          {/* Login Card */}
          <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border border-white/30">
            <CardContent className="p-8">
              
              {/* Bristol Logo */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-bristol-maroon rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-white font-serif font-bold text-3xl">B</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                  Sign In to Bristol
                </h2>
                <p className="text-bristol-stone">
                  Access your Site Intelligence Platform
                </p>
              </div>

              {/* Login Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-bristol-ink font-medium">Email Address</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Enter your email"
                    className="h-12 border-bristol-sky/30 focus:border-bristol-maroon focus:ring-bristol-maroon/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-bristol-ink font-medium">Password</Label>
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="Enter your password"
                    className="h-12 border-bristol-sky/30 focus:border-bristol-maroon focus:ring-bristol-maroon/20"
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full h-12 bg-bristol-maroon hover:bg-bristol-maroon/90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Sign In to Bristol
                </Button>

                {/* Additional Options */}
                <div className="text-center space-y-2">
                  <button className="text-bristol-maroon hover:text-bristol-maroon/80 text-sm font-medium transition-colors">
                    Forgot Password?
                  </button>
                  
                  <div className="text-bristol-stone text-xs">
                    Need access? Contact your Bristol administrator
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center mt-6">
            <p className="text-bristol-stone text-sm">
              Secure enterprise login powered by Bristol Development Group
            </p>
          </div>

        </div>
      </main>

      {/* Bristol Footer */}
      <BristolFooter variant="standard" />
    </div>
  );
}