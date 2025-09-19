import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Scan, Info, Camera, Database, Zap, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-6">
            <Scan className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Prospect Scrap
          </h1>
          <p className="text-muted-foreground mb-4">
            AI-powered business card and prospect scanning
          </p>
          
          {/* About Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4 mr-2" />
                About this app
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                  <Scan className="h-7 w-7" />
                  Prospect Scrap
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-8">
                {/* Problem & Inspiration */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">The Problem & Our Inspiration</h3>
                  <div className="bg-muted/20 p-6 rounded-xl space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Admission counselors are relationship builders.</strong> They travel extensively, 
                      attending conferences and visiting schools to recruit the next generation of students. In the process, 
                      they return with hundreds of business cards from networking events and thousands of prospect cards from school visits.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-background border-2 border-destructive/20 rounded-xl text-center">
                        <div className="text-3xl font-bold text-destructive mb-3">16 Hours</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          Manual data entry for 1,000 prospect cards<br/>
                          <span className="text-xs">(50 seconds per card + breaks)</span>
                        </div>
                      </div>
                      <div className="p-6 bg-background border-2 border-success/20 rounded-xl text-center">
                        <div className="text-3xl font-bold text-success mb-3">1 Hour</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          With Prospect Scrap automated processing<br/>
                          <span className="text-xs">(5 seconds per card)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-6 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="text-lg font-semibold text-primary mb-2">Result: 15 hours saved per 1,000 cards</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        More time for relationship building, professional development, and strategic initiatives
                      </div>
                    </div>
                  </div>
                </div>

                {/* What it does */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">What does Prospect Scrap do?</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Prospect Scrap is an intelligent OCR (Optical Character Recognition) platform that automatically 
                    extracts and organizes contact information from business cards and prospect forms. Simply take a 
                    photo or upload an image, and our AI will instantly parse all the relevant details into a structured format.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-5 bg-muted/20 rounded-xl">
                      <Camera className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Smart Scanning</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Auto-detects business cards vs prospect forms</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 bg-muted/20 rounded-xl">
                      <Database className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">Organized Storage</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">All contacts saved and easily searchable</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value Proposition */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Value Proposition</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
                      <Zap className="h-6 w-6 text-success flex-shrink-0" />
                      <span className="leading-relaxed"><strong>Save Time:</strong> No more manual data entry - get contact info in seconds</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
                      <Database className="h-6 w-6 text-success flex-shrink-0" />
                      <span className="leading-relaxed"><strong>Never Lose Contacts:</strong> Digital backup of all your business cards</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
                      <ArrowRight className="h-6 w-6 text-success flex-shrink-0" />
                      <span className="leading-relaxed"><strong>Export Ready:</strong> Download your contacts as Excel files</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl">
                      <Scan className="h-6 w-6 text-success flex-shrink-0" />
                      <span className="leading-relaxed"><strong>Multi-format Support:</strong> Works with business cards and prospect forms</span>
                    </div>
                  </div>
                </div>

                {/* How it Works */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">How it Works</h3>
                  <div className="bg-muted/20 p-6 rounded-xl">
                    <div className="space-y-6">
                      {/* Step 1 */}
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">1</div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1">Upload or Capture</div>
                          <div className="text-muted-foreground leading-relaxed">Take a photo or upload an image of your business card</div>
                        </div>
                        <Camera className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      </div>
                      
                      <div className="ml-5 border-l-2 border-muted h-6"></div>
                      
                      {/* Step 2 */}
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">2</div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1">AI Processing</div>
                          <div className="text-muted-foreground leading-relaxed">OpenAI Vision API extracts text and structures the data</div>
                        </div>
                        <Zap className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      </div>
                      
                      <div className="ml-5 border-l-2 border-muted h-6"></div>
                      
                      {/* Step 3 */}
                      <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">3</div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1">Review & Save</div>
                          <div className="text-muted-foreground leading-relaxed">Verify the extracted information and save to your database</div>
                        </div>
                        <Database className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Architecture */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Technical Architecture</h3>
                  <div className="bg-muted/20 p-6 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl mx-auto flex items-center justify-center">
                          <span className="font-bold text-xl">UI</span>
                        </div>
                        <div className="font-semibold text-lg">React Frontend</div>
                        <div className="text-muted-foreground leading-relaxed">Modern, responsive interface built with React and Tailwind CSS</div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl mx-auto flex items-center justify-center">
                          <Database className="h-8 w-8" />
                        </div>
                        <div className="font-semibold text-lg">Supabase Backend</div>
                        <div className="text-muted-foreground leading-relaxed">Authentication, database, and edge functions for OCR processing</div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl mx-auto flex items-center justify-center">
                          <Zap className="h-8 w-8" />
                        </div>
                        <div className="font-semibold text-lg">OpenAI Vision</div>
                        <div className="text-muted-foreground leading-relaxed">Advanced AI for text recognition and data extraction</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="px-6 py-6">
            <CardTitle className="text-center text-xl">Welcome</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-1"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-1"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="mt-1"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-sm font-medium">
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
                      className="mt-1"
                      placeholder="Create a password (min. 6 chars)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
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
                      className="mt-1"
                      placeholder="Confirm your password"
                    />
                    {password !== confirmPassword && confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        Passwords don't match
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || password !== confirmPassword}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;