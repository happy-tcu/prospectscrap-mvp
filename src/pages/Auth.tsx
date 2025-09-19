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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Scan className="h-6 w-6" />
                  Prospect Scrap
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Problem & Inspiration */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">The Problem & Our Inspiration</h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Admission counselors are relationship builders.</strong> They travel extensively, 
                      attending conferences and visiting schools to recruit the next generation of students. In the process, 
                      they return with hundreds of business cards from networking events and thousands of prospect cards from school visits.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                      <div className="p-4 border border-destructive rounded-lg">
                        <div className="text-2xl font-bold text-destructive mb-2">16 Hours</div>
                        <div className="text-sm text-muted-foreground">Manual data entry for 1,000 prospect cards<br/>(50 seconds per card + breaks)</div>
                      </div>
                      <div className="p-4 border border-success rounded-lg">
                        <div className="text-2xl font-bold text-success mb-2">1 Hour</div>
                        <div className="text-sm text-muted-foreground">With Prospect Scrap automated processing<br/>(5 seconds per card)</div>
                      </div>
                    </div>
                    <div className="text-center p-3 border border-foreground rounded-lg">
                      <div className="font-semibold text-primary">Result: 15 hours saved per 1,000 cards</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        More time for relationship building, professional development, and strategic initiatives
                      </div>
                    </div>
                  </div>
                </div>

                {/* What it does */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">What does Prospect Scrap do?</h3>
                  <p className="text-muted-foreground mb-4">
                    Prospect Scrap is an intelligent OCR (Optical Character Recognition) platform that automatically 
                    extracts and organizes contact information from business cards and prospect forms. Simply take a 
                    photo or upload an image, and our AI will instantly parse all the relevant details into a structured format.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Camera className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <h4 className="font-medium">Smart Scanning</h4>
                        <p className="text-sm text-muted-foreground">Auto-detects business cards vs prospect forms</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Database className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <h4 className="font-medium">Organized Storage</h4>
                        <p className="text-sm text-muted-foreground">All contacts saved and easily searchable</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value Proposition */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Value Proposition</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-success" />
                      <span><strong>Save Time:</strong> No more manual data entry - get contact info in seconds</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-success" />
                      <span><strong>Never Lose Contacts:</strong> Digital backup of all your business cards</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-5 w-5 text-success" />
                      <span><strong>Export Ready:</strong> Download your contacts as Excel files</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Scan className="h-5 w-5 text-success" />
                      <span><strong>Multi-format Support:</strong> Works with business cards and prospect forms</span>
                    </div>
                  </div>
                </div>

                {/* How it Works */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">How it Works</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
                        <div className="flex-1">
                          <div className="font-medium">Upload or Capture</div>
                          <div className="text-sm text-muted-foreground">Take a photo or upload an image of your business card</div>
                        </div>
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="ml-4 border-l-2 border-muted h-4"></div>
                      
                      {/* Step 2 */}
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
                        <div className="flex-1">
                          <div className="font-medium">AI Processing</div>
                          <div className="text-sm text-muted-foreground">OpenAI Vision API extracts text and structures the data</div>
                        </div>
                        <Zap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      
                      <div className="ml-4 border-l-2 border-muted h-4"></div>
                      
                      {/* Step 3 */}
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
                        <div className="flex-1">
                          <div className="font-medium">Review & Save</div>
                          <div className="text-sm text-muted-foreground">Verify the extracted information and save to your database</div>
                        </div>
                        <Database className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Architecture */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Technical Architecture</h3>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg mx-auto flex items-center justify-center">
                          <span className="font-bold">UI</span>
                        </div>
                        <div className="font-medium">React Frontend</div>
                        <div className="text-muted-foreground">Modern, responsive interface built with React and Tailwind CSS</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg mx-auto flex items-center justify-center">
                          <Database className="h-6 w-6" />
                        </div>
                        <div className="font-medium">Supabase Backend</div>
                        <div className="text-muted-foreground">Authentication, database, and edge functions for OCR processing</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg mx-auto flex items-center justify-center">
                          <Zap className="h-6 w-6" />
                        </div>
                        <div className="font-medium">OpenAI Vision</div>
                        <div className="text-muted-foreground">Advanced AI for text recognition and data extraction</div>
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