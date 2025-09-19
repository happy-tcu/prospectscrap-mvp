import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building, Mail, Phone, MapPin, ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Contact {
  id: string;
  full_name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  notes: string;
  created_at: string;
}

interface ContactsListProps {
  onBack: () => void;
}

const ContactsList: React.FC<ContactsListProps> = ({ onBack }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const exportData = contacts.map(contact => ({
      'Full Name': contact.full_name || '',
      'Title': contact.title || '',
      'Company': contact.company || '',
      'Email': contact.email || '',
      'Phone': contact.phone || '',
      'Address': contact.address_line || '',
      'City': contact.city || '',
      'State/Region': contact.state_region || '',
      'Postal Code': contact.postal_code || '',
      'Country': contact.country || '',
      'Notes': contact.notes || '',
      'Date Added': new Date(contact.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    
    const fileName = `contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 py-8">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Contacts
            </h1>
            <p className="text-muted-foreground text-lg">
              {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          {contacts.length > 0 && (
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? 'No contacts found matching your search.' : 'No contacts saved yet.'}
              </div>
              {!searchTerm && (
                <Button onClick={onBack} className="mt-4">
                  Scan Your First Card
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {contact.full_name || 'Unknown Name'}
                      </CardTitle>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {contact.title}
                        </p>
                      )}
                    </div>
                  </div>
                  {contact.company && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{contact.company}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{contact.phone}</span>
                    </div>
                  )}
                  {(contact.address_line || contact.city || contact.state_region) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-foreground">
                        {contact.address_line && <div>{contact.address_line}</div>}
                        {(contact.city || contact.state_region || contact.postal_code) && (
                          <div>
                            {[contact.city, contact.state_region, contact.postal_code]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground">{contact.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsList;