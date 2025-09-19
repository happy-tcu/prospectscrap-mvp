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
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 sm:py-8">
          <Button onClick={onBack} variant="outline" size="sm" className="self-start sm:self-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Scanner</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Contacts
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          {contacts.length > 0 && (
            <Button onClick={exportToExcel} variant="outline" size="sm" className="self-start sm:self-center">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
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
            <CardContent className="py-8 sm:py-12 text-center px-4 sm:px-6">
              <div className="text-muted-foreground text-sm sm:text-base">
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {contact.full_name || 'Unknown Name'}
                      </CardTitle>
                      {contact.title && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                          {contact.title}
                        </p>
                      )}
                    </div>
                  </div>
                  {contact.company && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">{contact.company}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">{contact.phone}</span>
                    </div>
                  )}
                  {(contact.address_line || contact.city || contact.state_region) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-xs sm:text-sm text-foreground min-w-0">
                        {contact.address_line && <div className="truncate">{contact.address_line}</div>}
                        {(contact.city || contact.state_region || contact.postal_code) && (
                          <div className="truncate">
                            {[contact.city, contact.state_region, contact.postal_code]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="mt-2 sm:mt-3 p-2 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground line-clamp-2">{contact.notes}</p>
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