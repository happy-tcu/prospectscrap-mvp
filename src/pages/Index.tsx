import { useAuth } from '@/contexts/AuthContext';
import BusinessCardScanner from '@/components/BusinessCardScanner';
import { Scan } from 'lucide-react';

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-32 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-cyberpunk rounded-2xl mb-6 shadow-cyberpunk animate-glow-rotate">
            <Scan className="h-8 w-8 text-white" />
          </div>
          <div className="relative mb-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-secondary rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="text-foreground font-medium text-lg mb-2 neon-text">Initializing Scanner</p>
          <p className="text-muted-foreground text-sm animate-pulse">Connecting to neural network...</p>
        </div>
      </div>
    );
  }

  return <BusinessCardScanner />;
};

export default Index;
