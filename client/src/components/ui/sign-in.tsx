import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, KeyRound, Mail, Sparkles } from "lucide-react"

// Simple SVG components for brand icons as placeholders
const GoogleIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="https://svgl.app/library/google.svg" {...props}/>
)

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

const XIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="https://svgl.app/library/x.svg" {...props}/>
)

const AppleIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="https://svgl.app/library/apple.svg" {...props}/>
)

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onEmailSubmit?: (data: { email: string; password?: string }) => void
  onSocialSignIn?: (provider: 'google' | 'github' | 'x' | 'apple') => void
  onEmailLink?: () => void
}

const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
  ({ className, onEmailSubmit, onSocialSignIn, onEmailLink, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      onEmailSubmit?.({ email, password })
    }

    return (
      <Card 
        ref={ref} 
        className={cn("w-full max-w-xl mx-auto relative overflow-hidden", className)} 
        style={{
          background: `
            linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 25%, rgba(241, 245, 249, 0.97) 50%, rgba(248, 250, 252, 0.99) 75%, rgba(255, 255, 255, 0.98) 100%),
            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(139, 38, 53, 0.02) 2px, rgba(139, 38, 53, 0.02) 4px),
            repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(212, 165, 116, 0.015) 1px, rgba(212, 165, 116, 0.015) 3px)
          `,
          boxShadow: `
            0 25px 50px -12px rgba(139, 38, 53, 0.08),
            0 10px 25px -5px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(139, 38, 53, 0.03)
          `,
          border: '1px solid rgba(139, 38, 53, 0.1)'
        }}
        {...props}>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl font-serif whitespace-nowrap">Sign In To Bristol AI Intelligence</CardTitle>
          <CardDescription className="font-serif">
            Access your Site Intelligence Platform for enterprise real estate analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Social Sign-in */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-serif">Sign in with</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onSocialSignIn?.('google')}
                  title="Sign in with Google"
                >
                  <GoogleIcon className="size-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onSocialSignIn?.('github')}
                  title="Sign in with GitHub"
                >
                  <GitHubIcon className="size-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onSocialSignIn?.('x')}
                  title="Sign in with X (Twitter)"
                >
                  <XIcon className="size-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onSocialSignIn?.('apple')}
                  title="Sign in with Apple"
                >
                  <AppleIcon className="size-5" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-serif">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="your.email@company.com" className="pl-9" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-serif">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline font-serif">Forgot password?</a>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} className="pl-9 pr-10" required />
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full font-serif relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(6, 182, 212, 0.4)',
                  boxShadow: `
                    0 8px 32px rgba(6, 182, 212, 0.3),
                    0 4px 16px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(6, 182, 212, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 24px rgba(6, 182, 212, 0.25),
                    0 4px 12px rgba(6, 182, 212, 0.15),
                    0 0 15px rgba(6, 182, 212, 0.2),
                    inset 0 1px 0 rgba(6, 182, 212, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `;
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 1) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(0, 0, 0, 1) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `
                    0 8px 32px rgba(6, 182, 212, 0.3),
                    0 4px 16px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(6, 182, 212, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `;
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                }}
              >
                {/* Animated cyan shimmer overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.3), transparent)',
                    animation: 'shimmer 2s ease-in-out infinite'
                  }}
                />
                
                {/* Glass reflection */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%)'
                  }}
                />
                
                {/* Button text */}
                <span className="relative z-10 font-bold text-cyan-400 drop-shadow-lg">
                  Sign In
                </span>
                
                {/* Animated border glow */}
                <div 
                  className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(6, 182, 212, 0.4)',
                    filter: 'blur(4px)',
                    zIndex: -1
                  }}
                />
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-4">
          <div className="w-full">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-bristol-maroon/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-bristol-stone font-serif">Bristol Team Access</span>
              </div>
            </div>
            <div className="relative">
              {/* Bristol maroon ambient glow behind button */}
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139, 38, 53, 0.4) 0%, rgba(139, 38, 53, 0.2) 50%, transparent 100%)',
                  filter: 'blur(8px)',
                  transform: 'scale(1.1)',
                  zIndex: -1
                }}
              />
              
              <Button 
                className="w-full font-serif relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] shadow-lg"
                onClick={() => onEmailLink?.()}
                style={{
                  background: 'linear-gradient(135deg, #8B2635 0%, #A03545 50%, #8B2635 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  boxShadow: '0 4px 20px rgba(139, 38, 53, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Enhanced shimmer effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                    animation: 'shimmer 2s ease-in-out infinite'
                  }}
                />
                
                {/* Sparkle icon with enhanced visibility */}
                <Sparkles className="mr-3 h-5 w-5 group-hover:animate-pulse relative z-10 drop-shadow-sm" />
                
                {/* Button text with enhanced readability */}
                <span className="relative z-10 font-bold text-white drop-shadow-sm">
                  Bristol Team Email Registration
                </span>
                
                {/* Enhanced hover glow */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 20px rgba(139, 38, 53, 0.6)'
                  }}
                />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center w-full font-serif">
            By logging in, you agree to our{' '}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{' '}
            &{' '}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </CardFooter>
      </Card>
    )
  }
)
AuthForm.displayName = "AuthForm"

export { AuthForm }