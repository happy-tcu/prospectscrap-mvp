import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building, Mail, Phone, MapPin, ArrowLeft, Download, CreditCard, GraduationCap, Filter, Edit, Trash2, Calendar, School } from 'lucide-react';
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
  source_user: string;
  created_at: string;
  card_type: string;
  // Organization fields
  event_name?: string;
  school_name?: string;
  event_date?: string;
  batch_id?: string;
  // Prospect card fields
  gender?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  preferred_first_name?: string;
  date_of_birth?: string;
  email_confirmation?: string;
  country_of_citizenship?: string;
  current_school?: string;
  year_entering_university?: string;
  entry_status?: string;
}

interface ContactsListProps {
  onBack: () => void;
  onEditContact?: (contact: Contact) => void;
}

const ContactsList: React.FC<ContactsListProps> = ({ onBack, onEditContact }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<'all' | 'business_card' | 'prospect_card'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const { user } = useAuth();

  // Get unique events and dates for filtering
  const uniqueEvents = useMemo(() => {
    const events = new Set<string>();
    contacts.forEach(contact => {
      if (contact.event_name) {
        const eventKey = contact.event_date ? 
          `${contact.event_name} (${new Date(contact.event_date).toLocaleDateString()})` : 
          contact.event_name;
        events.add(eventKey);
      }
    });
    return Array.from(events).sort();
  }, [contacts]);

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

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = cardTypeFilter === 'all' || 
      (contact.card_type || 'business_card') === cardTypeFilter;
    
    const matchesEvent = eventFilter === 'all' || 
      eventFilter === 'no-event' && !contact.event_name ||
      (contact.event_name && (
        eventFilter === contact.event_name ||
        eventFilter === `${contact.event_name} (${contact.event_date ? new Date(contact.event_date).toLocaleDateString() : ''})`
      ));
    
    return matchesSearch && matchesType && matchesEvent;
  });

  // Group contacts by event for better organization
  const groupedContacts = useMemo(() => {
    if (eventFilter !== 'all') {
      return { [eventFilter]: filteredContacts };
    }

    const groups: Record<string, Contact[]> = {};
    filteredContacts.forEach(contact => {
      const eventKey = contact.event_name ? 
        (contact.event_date ? 
          `${contact.event_name} (${new Date(contact.event_date).toLocaleDateString()})` : 
          contact.event_name) :
        'No Event';
      if (!groups[eventKey]) {
        groups[eventKey] = [];
      }
      groups[eventKey].push(contact);
    });

    return groups;
  }, [filteredContacts, eventFilter]);

  const exportToExcel = (type: 'all' | 'business_card' | 'prospect_card' = 'all') => {
    const contactsToExport = type === 'all' ? contacts : 
      contacts.filter(contact => (contact.card_type || 'business_card') === type);

    // Group contacts by school for organized tabs
    const contactsBySchool = contactsToExport.reduce((acc, contact) => {
      const schoolKey = contact.school_name || contact.current_school || 'Other';
      if (!acc[schoolKey]) {
        acc[schoolKey] = [];
      }
      acc[schoolKey].push(contact);
      return acc;
    }, {} as Record<string, Contact[]>);

    const workbook = XLSX.utils.book_new();

    // Create separate sheets for each school
    Object.entries(contactsBySchool).forEach(([schoolName, schoolContacts]) => {
      if (type === 'prospect_card') {
        const exportData = schoolContacts.map(contact => ({
          'Gender': contact.gender || '',
          'First Name': contact.first_name || '',
          'Middle Name': contact.middle_name || '',
          'Last Name': contact.last_name || '',
          'Preferred First Name': contact.preferred_first_name || '',
          'Date of Birth': contact.date_of_birth || '',
          'Email': contact.email || '',
          'Email Confirmation': contact.email_confirmation || '',
          'Country of Citizenship': contact.country_of_citizenship || '',
          'Current School': contact.current_school || '',
          'Year Entering University': contact.year_entering_university || '',
          'Entry Status': contact.entry_status || '',
          'Event Name': contact.event_name || '',
          'School Name': contact.school_name || '',
          'Event Date': contact.event_date || '',
          'Notes': contact.notes || '',
          'Date Added': new Date(contact.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const sheetName = schoolName.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      } else {
        const exportData = schoolContacts.map(contact => ({
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
          'Event Name': contact.event_name || '',
          'School Name': contact.school_name || '',
          'Event Date': contact.event_date || '',
          'Notes': contact.notes || '',
          'Date Added': new Date(contact.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const sheetName = schoolName.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    const filePrefix = type === 'business_card' ? 'business-cards' : 
                      type === 'prospect_card' ? 'prospect-cards' : 'all-contacts';
    const fileName = `${filePrefix}-by-school-${new Date().toISOString().split('T')[0]}.xlsx`;
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
              My Cards
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              {filteredContacts.length} of {contacts.length} card{contacts.length !== 1 ? 's' : ''}
              {eventFilter !== 'all' && ` • Filtered by: ${eventFilter}`}
            </p>
          </div>
          <div className="flex gap-2">
            {contacts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border z-50">
                  <DropdownMenuItem onClick={() => exportToExcel('all')}>
                    Export All Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel('business_card')}>
                    Export Business Cards Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel('prospect_card')}>
                    Export Prospect Cards Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="default" className="sm:w-auto w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      {cardTypeFilter === 'all' ? 'All Cards' : 
                       cardTypeFilter === 'business_card' ? 'Business Cards' : 'Prospect Cards'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border z-50">
                    <DropdownMenuItem onClick={() => setCardTypeFilter('all')}>
                      <Filter className="h-4 w-4 mr-2" />
                      All Cards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCardTypeFilter('business_card')}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Business Cards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCardTypeFilter('prospect_card')}>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Prospect Cards
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="default" className="sm:w-auto w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      {eventFilter === 'all' ? 'All Events' : 
                       eventFilter === 'no-event' ? 'No Event' : 
                       eventFilter.length > 20 ? eventFilter.substring(0, 20) + '...' : eventFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border z-50 max-w-80">
                    <DropdownMenuItem onClick={() => setEventFilter('all')}>
                      <Calendar className="h-4 w-4 mr-2" />
                      All Events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEventFilter('no-event')}>
                      <Filter className="h-4 w-4 mr-2" />
                      No Event
                    </DropdownMenuItem>
                    {uniqueEvents.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        {uniqueEvents.map((event) => (
                          <DropdownMenuItem key={event} onClick={() => setEventFilter(event)}>
                            <School className="h-4 w-4 mr-2" />
                            <span className="truncate">{event}</span>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 sm:py-12 text-center px-4 sm:px-6">
              <div className="text-muted-foreground text-sm sm:text-base">
                {searchTerm || eventFilter !== 'all' || cardTypeFilter !== 'all' ? 
                  'No contacts found matching your filters.' : 
                  'No contacts saved yet.'}
              </div>
              {!searchTerm && eventFilter === 'all' && cardTypeFilter === 'all' && (
                <Button onClick={onBack} className="mt-4">
                  Scan Your First Card
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedContacts).map(([groupName, groupContacts]) => (
              <div key={groupName}>
                {eventFilter === 'all' && Object.keys(groupedContacts).length > 1 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      {groupName === 'No Event' ? (
                        <>
                          <Filter className="h-5 w-5" />
                          No Event
                        </>
                      ) : (
                        <>
                          <Calendar className="h-5 w-5" />
                          {groupName}
                        </>
                      )}
                      <Badge variant="secondary" className="ml-2">
                        {groupContacts.length}
                      </Badge>
                    </h3>
                  </div>
                )}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {groupContacts.map((contact) => (
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
                        {contact.event_name && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <span className="text-xs sm:text-sm font-medium truncate">
                              {contact.event_name}
                              {contact.event_date && ` • ${new Date(contact.event_date).toLocaleDateString()}`}
                            </span>
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
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {new Date(contact.created_at).toLocaleDateString()}
                            </Badge>
                            <Badge variant={contact.card_type === 'prospect_card' ? 'default' : 'outline'} className="text-xs">
                              {contact.card_type === 'prospect_card' ? (
                                <>
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  Prospect
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Business
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {onEditContact && (
                              <Button
                                onClick={() => onEditContact(contact)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsList;