import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, User, Building, Mail, Phone, CheckCircle, Save } from 'lucide-react';

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

interface BatchReviewGridProps {
  contacts: ContactData[];
  onUpdateContact: (index: number, field: keyof ContactData, value: string) => void;
  onRemoveContact: (index: number) => void;
  editingIndex: number | null;
  onEditContact: (index: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSaveBatch: () => void;
  isSaving: boolean;
}

const BatchReviewGrid: React.FC<BatchReviewGridProps> = ({
  contacts,
  onUpdateContact,
  onRemoveContact,
  editingIndex,
  onEditContact,
  onSaveEdit,
  onCancelEdit,
  onSaveBatch,
  isSaving
}) => {
  const renderContactCard = (contact: ContactData, index: number) => {
    const isEditing = editingIndex === index;
    const isProspect = contact.card_type === 'prospect_card';

    return (
      <Card key={index} className="border shadow-sm">
        <CardHeader className="px-4 py-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {isProspect ? (
                <User className="h-4 w-4 text-primary" />
              ) : (
                <Building className="h-4 w-4 text-primary" />
              )}
              <CardTitle className="text-base">
                Contact {index + 1}
              </CardTitle>
              <Badge variant={isProspect ? "secondary" : "default"} className="text-xs">
                {isProspect ? 'Prospect' : 'Business'}
              </Badge>
            </div>
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={onSaveEdit}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                    ×
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onEditContact(index)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onRemoveContact(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {isEditing ? (
            // Edit mode
            <div className="space-y-3">
              {isProspect ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">First Name</Label>
                      <Input
                        value={contact.first_name || ''}
                        onChange={(e) => onUpdateContact(index, 'first_name', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name</Label>
                      <Input
                        value={contact.last_name || ''}
                        onChange={(e) => onUpdateContact(index, 'last_name', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={contact.email}
                      onChange={(e) => onUpdateContact(index, 'email', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Current School</Label>
                    <Input
                      value={contact.current_school || ''}
                      onChange={(e) => onUpdateContact(index, 'current_school', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      value={contact.full_name}
                      onChange={(e) => onUpdateContact(index, 'full_name', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={contact.company}
                      onChange={(e) => onUpdateContact(index, 'company', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={contact.email}
                      onChange={(e) => onUpdateContact(index, 'email', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => onUpdateContact(index, 'phone', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            // View mode
            <div className="space-y-2">
              {isProspect ? (
                <>
                  <div className="text-sm font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.current_school && (
                    <div className="text-xs text-muted-foreground">
                      {contact.current_school}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">{contact.full_name}</div>
                  {contact.company && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {contact.company}
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Review {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
        </h3>
        <Button 
          onClick={onSaveBatch} 
          disabled={isSaving || contacts.length === 0}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : `Save All (${contacts.length})`}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact, index) => renderContactCard(contact, index))}
      </div>
      
      {contacts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No contacts to review. All files may have failed processing.
        </div>
      )}
    </div>
  );
};

export default BatchReviewGrid;