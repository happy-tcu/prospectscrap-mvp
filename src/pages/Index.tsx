import { useAuth } from '@/contexts/AuthContext';
import BusinessCardScanner from '@/components/BusinessCardScanner';
import { Scan } from 'lucide-react';

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
            <Scan className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <BusinessCardScanner />;
};

export default Index;
