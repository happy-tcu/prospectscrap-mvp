import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Save, Check, X, User, Building, Mail, Phone, MapPin, FileText, Loader2, GraduationCap, CreditCard } from 'lucide-react';

interface ContactData {
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
  card_type: string;
  event_name?: string;
  school_name?: string;
  event_date?: string;
  batch_id?: string;
  // Prospect card specific fields
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

interface BatchReviewProps {
  batchData: ContactData[];
  onSave: (selectedContacts: ContactData[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const BatchReview: React.FC<BatchReviewProps> = ({
  batchData,
  onSave,
  onBack,
  isLoading = false
}) => {
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(
    new Set(batchData.map((_, index) => index))
  );
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<ContactData[]>(batchData);
  const { toast } = useToast();

  const handleContactSelect = (index: number, selected: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (selected) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(new Set(batchData.map((_, index) => index)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleFieldChange = (index: number, field: keyof ContactData, value: string) => {
    const newData = [...editedData];
    newData[index] = { ...newData[index], [field]: value };
    setEditedData(newData);
  };

  const handleSaveSelected = () => {
    const contactsToSave = Array.from(selectedContacts).map(index => editedData[index]);
    onSave(contactsToSave);
  };

  const allSelected = selectedContacts.size === batchData.length;
  const someSelected = selectedContacts.size > 0 && selectedContacts.size < batchData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Extracted Cards</h2>
          <p className="text-muted-foreground">
            {selectedContacts.size} of {batchData.length} cards selected for saving
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <Button
            onClick={handleSaveSelected}
            disabled={selectedContacts.size === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Selected ({selectedContacts.size})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Actions</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label>Select All</Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Cards */}
      <div className="grid gap-4">
        {editedData.map((contact, index) => (
          <Card key={index} className={`transition-all ${selectedContacts.has(index) ? 'ring-2 ring-primary' : 'opacity-60'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedContacts.has(index)}
                    onCheckedChange={(checked) => handleContactSelect(index, checked as boolean)}
                  />
                  <Badge variant={contact.card_type === 'prospect_card' ? 'default' : 'outline'}>
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
                  <CardTitle className="text-lg">
                    {contact.full_name || 'Unknown Name'}
                  </CardTitle>
                </div>
                <Button
                  onClick={() => setEditingContact(editingContact === index ? null : index)}
                  variant="outline"
                  size="sm"
                >
                  {editingContact === index ? 'View' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingContact === index ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={contact.full_name}
                        onChange={(e) => handleFieldChange(index, 'full_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={contact.email}
                        onChange={(e) => handleFieldChange(index, 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => handleFieldChange(index, 'phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={contact.company}
                        onChange={(e) => handleFieldChange(index, 'company', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={contact.notes}
                      onChange={(e) => handleFieldChange(index, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.company}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="md:col-span-2 flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{contact.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BatchReview;