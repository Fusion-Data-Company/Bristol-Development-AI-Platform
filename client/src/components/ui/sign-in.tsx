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

const MicrosoftIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="https://svgl.app/library/microsoft.svg" {...props}/>
)

const AppleIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="https://svgl.app/library/apple.svg" {...props}/>
)

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onEmailSubmit?: (data: { email: string; password?: string }) => void
  onSocialSignIn?: (provider: 'google' | 'microsoft' | 'apple' | 'sso') => void
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
      <Card ref={ref} className={cn("w-full max-w-md mx-auto", className)} {...props}>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl font-serif">Sign In To Bristol AI Intelligence</CardTitle>
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
                <Button variant="outline" onClick={() => onSocialSignIn?.('google')}>
                  <GoogleIcon className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => onSocialSignIn?.('microsoft')}>
                  <MicrosoftIcon className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => onSocialSignIn?.('apple')}>
                  <AppleIcon className="size-5" />
                </Button>
                <Button variant="outline" onClick={() => onSocialSignIn?.('sso')}>
                  <KeyRound className="h-5 w-5" />
                  <span className="ml-1.5">SSO</span>
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
                    0 12px 48px rgba(6, 182, 212, 0.5),
                    0 6px 24px rgba(6, 182, 212, 0.3),
                    0 0 30px rgba(6, 182, 212, 0.4),
                    inset 0 1px 0 rgba(6, 182, 212, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `;
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 1) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(0, 0, 0, 1) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.8)';
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
          <Button variant="ghost" className="w-full text-muted-foreground font-serif" onClick={() => onEmailLink?.()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Or email me a link
          </Button>
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