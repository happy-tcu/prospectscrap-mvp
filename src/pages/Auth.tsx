import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Scan } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (!error) {
      setActiveTab('signin');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-hero rounded-2xl mb-6 shadow-cyberpunk float-animation">
            <Scan className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-3 neon-text">
            Scanner Pro
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Advanced OCR scanning with AI intelligence
          </p>
        </div>

        <div className="cyber-card rounded-2xl animate-scale-in" style={{animationDelay: '0.2s'}}>
          <CardHeader className="px-6 sm:px-8 py-6 sm:py-8">
            <CardTitle className="text-center text-xl sm:text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Access Terminal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-primary/20">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-glow transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="animate-fade-in">
                <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5">
                  <div>
                    <Label htmlFor="signin-email" className="text-sm font-medium text-foreground/90">
                      Email Address
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-2 bg-muted/30 border-primary/30 focus:border-primary focus:ring-primary/50 transition-all duration-300 hover:border-primary/50"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-sm font-medium text-foreground/90">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-2 bg-muted/30 border-primary/30 focus:border-primary focus:ring-primary/50 transition-all duration-300 hover:border-primary/50"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 sm:h-12 bg-gradient-primary hover:bg-gradient-neon text-primary-foreground shadow-glow hover:shadow-neon transition-all duration-300 font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Access System'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="animate-fade-in">
                <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                  <div>
                    <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/90">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-2 bg-muted/30 border-secondary/30 focus:border-secondary focus:ring-secondary/50 transition-all duration-300 hover:border-secondary/50"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/90">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="mt-2 bg-muted/30 border-secondary/30 focus:border-secondary focus:ring-secondary/50 transition-all duration-300 hover:border-secondary/50"
                      placeholder="Create a password (min. 6 chars)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground/90">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="mt-2 bg-muted/30 border-secondary/30 focus:border-secondary focus:ring-secondary/50 transition-all duration-300 hover:border-secondary/50"
                      placeholder="Confirm your password"
                    />
                    {password !== confirmPassword && confirmPassword && (
                      <p className="text-xs sm:text-sm text-destructive mt-2 animate-fade-in">
                        ⚠️ Passwords don't match
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 sm:h-12 bg-gradient-primary hover:bg-gradient-neon text-primary-foreground shadow-glow hover:shadow-neon transition-all duration-300 font-semibold" 
                    disabled={isLoading || password !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Initialize Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground/70 animate-fade-in" style={{animationDelay: '0.4s'}}>
          Secure • Encrypted • Future-Ready
        </p>
      </div>
    </div>
  );
};

export default Auth;