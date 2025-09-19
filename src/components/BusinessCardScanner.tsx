import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ContactsList from '@/components/ContactsList';
import { Camera, Upload, Scan, Save, User, Building, Mail, Phone, MapPin, FileText, Loader2, LogOut, List, Globe, CreditCard, GraduationCap, Edit } from 'lucide-react';

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

const BusinessCardScanner = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rawText, setRawText] = useState('');
  const [contactData, setContactData] = useState<ContactData>({
    full_name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    address_line: '',
    city: '',
    state_region: '',
    postal_code: '',
      country: '',
      notes: '',
      source_user: '',
      card_type: 'business_card'
    });
  const [step, setStep] = useState<'upload' | 'review' | 'saved'>('upload');
  const [showContacts, setShowContacts] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [translationsMade, setTranslationsMade] = useState<boolean>(false);
  const [cardType, setCardType] = useState<'auto' | 'business_card' | 'prospect_card'>('auto');
  
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateContact, setDuplicateContact] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (showContacts) {
    return <ContactsList 
      onBack={() => setShowContacts(false)} 
      onEditContact={(contact) => {
        setIsEditing(true);
        setEditingContactId(contact.id);
        setContactData({
          full_name: contact.full_name || '',
          title: contact.title || '',
          company: contact.company || '',
          email: contact.email || '',
          phone: contact.phone || '',
          address_line: contact.address_line || '',
          city: contact.city || '',
          state_region: contact.state_region || '',
          postal_code: contact.postal_code || '',
          country: contact.country || '',
          notes: contact.notes || '',
          source_user: contact.source_user || '',
          card_type: contact.card_type || 'business_card',
          gender: contact.gender || '',
          first_name: contact.first_name || '',
          middle_name: contact.middle_name || '',
          last_name: contact.last_name || '',
          preferred_first_name: contact.preferred_first_name || '',
          date_of_birth: contact.date_of_birth || '',
          email_confirmation: contact.email_confirmation || '',
          country_of_citizenship: contact.country_of_citizenship || '',
          current_school: contact.current_school || '',
          year_entering_university: contact.year_entering_university || '',
          entry_status: contact.entry_status || ''
        });
        setStep('review');
        setShowContacts(false);
      }}
    />;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStep('upload');
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const extractWithOCR = async (file: File): Promise<{ 
    raw_text: string; 
    parsed: ContactData; 
    detected_language?: string; 
    translations_made?: boolean;
    card_type?: string;
  }> => {
    console.log('Starting OCR extraction for file:', file.name, 'size:', file.size);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('source_user', user?.email || '');
    formData.append('card_type', cardType);

    console.log('Calling ocr-extract function...');
    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: formData
    });

    console.log('OCR function response:', { data, error });

    if (error) {
      console.error('OCR Error details:', error);
      throw new Error(error.message || 'OCR extraction failed');
    }

    if (!data) {
      console.error('No data returned from OCR function');
      throw new Error('No data returned from OCR extraction');
    }

    return data;
  };

  const handleExtractFields = async () => {
    if (!selectedFile || !user) return;
    
    setIsProcessing(true);
    try {
      const result = await extractWithOCR(selectedFile);
      setRawText(result.raw_text);
      setContactData({ ...result.parsed, source_user: user.email || '' });
      setDetectedLanguage(result.detected_language || 'English');
      setTranslationsMade(result.translations_made || false);
      setStep('review');
      
      const cardTypeText = result.parsed.card_type === 'prospect_card' ? 'prospect card' : 'business card';
      const toastMessage = result.translations_made 
        ? `${cardTypeText} extracted and translated from ${result.detected_language} to English`
        : `${cardTypeText} extracted successfully`;
      
      toast({
        title: "Extraction completed",
        description: toastMessage
      });
    } catch (error) {
      console.error('OCR extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);
      toast({
        title: "Extraction failed",
        description: `Could not extract fields from the card: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    if (isEditing) {
      handleUpdate();
    } else {
      handleSave();
    }
  };

  const handleUpdate = async () => {
    if (!user || !editingContactId) return;
    
    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', editingContactId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Contact updated successfully",
        description: `The ${contactData.card_type === 'prospect_card' ? 'prospect card' : 'business card'} information has been updated.`
      });
      setStep('saved');
      setIsEditing(false);
      setEditingContactId(null);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "Could not update the contact information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (forceOverride: boolean = false) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check for duplicates by email only (if not editing and not forcing override)
      if (!isEditing && !forceOverride && contactData.email) {
        const { data: existingContacts, error: searchError } = await supabase
          .from('contacts')
          .select('id, email, full_name')
          .eq('user_id', user.id)
          .eq('email', contactData.email)
          .limit(1);

        if (searchError) {
          throw searchError;
        }

        if (existingContacts && existingContacts.length > 0) {
          setDuplicateContact(existingContacts[0]);
          setShowDuplicateDialog(true);
          return;
        }
      }

      // Save new contact
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          ...contactData,
          raw_ocr_text: rawText
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Contact saved successfully",
        description: `The ${contactData.card_type === 'prospect_card' ? 'prospect card' : 'business card'} information has been added to your database.`
      });
      setStep('saved');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Could not save the contact information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setRawText('');
    setContactData({
      full_name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      address_line: '',
      city: '',
      state_region: '',
      postal_code: '',
      country: '',
      notes: '',
      source_user: '',
      card_type: 'business_card'
    });
    setDetectedLanguage('');
    setTranslationsMade(false);
    setCardType('auto');
    setIsEditing(false);
    setEditingContactId(null);
    setShowDuplicateDialog(false);
    setDuplicateContact(null);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-8">
          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Scan className="h-5 w-5 text-primary-foreground" />
              </div>
            <h1 className="text-4xl font-bold text-foreground">
              {isEditing ? 'Edit Contact' : 'Prospect Scrap'}
            </h1>
            </div>
            <p className="text-muted-foreground">
              {isEditing ? 'Update contact information' : 'Scan and manage your business cards and prospects'}
            </p>
          </div>
          <div className="flex gap-3 justify-center sm:justify-end">
            <Button 
              onClick={() => setShowContacts(true)} 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline ml-2">My Contacts</span>
              <span className="sm:hidden ml-2">Contacts</span>
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
              <span className="sm:hidden ml-2">Exit</span>
            </Button>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {step === 'upload' && (
          <Card className="border shadow-sm">
            <CardHeader className="px-6 py-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Scan className="h-5 w-5" />
                Scan Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              {/* Card Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Card Type</Label>
                <RadioGroup value={cardType} onValueChange={(value) => setCardType(value as 'auto' | 'business_card' | 'prospect_card')} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Scan className="h-4 w-4" />
                      Auto-detect
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="business_card" id="business" />
                    <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4" />
                      Business Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="prospect_card" id="prospect" />
                    <Label htmlFor="prospect" className="flex items-center gap-2 cursor-pointer flex-1">
                      <GraduationCap className="h-4 w-4" />
                      Prospect Card
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {!selectedFile ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">Upload an image or take a photo to get started</p>
                  <div className="flex flex-col gap-3 px-4 max-w-sm mx-auto">
                    <Button
                      onClick={handleCameraCapture}
                      size="lg"
                      className="w-full"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      onClick={handleFileUpload}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border bg-muted/20">
                    <img
                      src={previewUrl}
                      alt="Scanned document preview"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleExtractFields}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Extract Data
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleReset} 
                      variant="outline"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Raw OCR Text */}
            <Card className="border shadow-sm">
              <CardHeader className="px-6 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-5 w-5" />
                  Extracted Text
                </CardTitle>
                {translationsMade && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Globe className="h-4 w-4" />
                    Translated from {detectedLanguage} to English
                  </div>
                )}
                {!translationsMade && detectedLanguage !== 'English' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    Detected language: {detectedLanguage}
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{rawText}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card className="border shadow-sm">
              <CardHeader className="px-6 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6">
                {contactData.card_type === 'prospect_card' ? (
                  /* Prospect Card Form */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm">Gender</Label>
                        <RadioGroup value={contactData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)} className="flex gap-4 mt-1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Male" id="male" />
                            <Label htmlFor="male" className="cursor-pointer">Male</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Female" id="female" />
                            <Label htmlFor="female" className="cursor-pointer">Female</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="first_name" className="text-sm">First Name (Given)</Label>
                        <Input
                          id="first_name"
                          value={contactData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="middle_name" className="text-sm">Middle Name</Label>
                        <Input
                          id="middle_name"
                          value={contactData.middle_name || ''}
                          onChange={(e) => handleInputChange('middle_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name" className="text-sm">Last Name (Family)</Label>
                        <Input
                          id="last_name"
                          value={contactData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="preferred_first_name" className="text-sm">Preferred First Name</Label>
                      <Input
                        id="preferred_first_name"
                        value={contactData.preferred_first_name || ''}
                        onChange={(e) => handleInputChange('preferred_first_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Date of Birth</Label>
                      <Input
                        value={contactData.date_of_birth || ''}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        placeholder="MM/DD/YYYY"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email_confirmation" className="text-sm">Confirm Email</Label>
                        <Input
                          id="email_confirmation"
                          type="email"
                          value={contactData.email_confirmation || ''}
                          onChange={(e) => handleInputChange('email_confirmation', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="country_of_citizenship" className="text-sm">Country of Citizenship</Label>
                      <Input
                        id="country_of_citizenship"
                        value={contactData.country_of_citizenship || ''}
                        onChange={(e) => handleInputChange('country_of_citizenship', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="current_school" className="text-sm">Current School</Label>
                      <Input
                        id="current_school"
                        value={contactData.current_school || ''}
                        onChange={(e) => handleInputChange('current_school', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="year_entering_university" className="text-sm">Year Entering University</Label>
                      <Input
                        id="year_entering_university"
                        value={contactData.year_entering_university || ''}
                        onChange={(e) => handleInputChange('year_entering_university', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Entry Status</Label>
                      <RadioGroup value={contactData.entry_status || ''} onValueChange={(value) => handleInputChange('entry_status', value)} className="flex gap-4 mt-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="First Year" id="first_year" />
                          <Label htmlFor="first_year" className="cursor-pointer">First Year</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Transfer" id="transfer" />
                          <Label htmlFor="transfer" className="cursor-pointer">Transfer</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm">Notes</Label>
                      <Textarea
                        id="notes"
                        value={contactData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  /* Business Card Form */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="full_name" className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          value={contactData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="title" className="text-sm">Title</Label>
                        <Input
                          id="title"
                          value={contactData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company" className="flex items-center gap-2 text-sm">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                        Company
                      </Label>
                      <Input
                        id="company"
                        value={contactData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={contactData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address_line" className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        Address
                      </Label>
                      <Input
                        id="address_line"
                        value={contactData.address_line}
                        onChange={(e) => handleInputChange('address_line', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm">City</Label>
                        <Input
                          id="city"
                          value={contactData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state_region" className="text-sm">State</Label>
                        <Input
                          id="state_region"
                          value={contactData.state_region}
                          onChange={(e) => handleInputChange('state_region', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code" className="text-sm">ZIP Code</Label>
                        <Input
                          id="postal_code"
                          value={contactData.postal_code}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm">Notes</Label>
                      <Textarea
                        id="notes"
                        value={contactData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="flex-1"
                  >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isEditing ? 'Updating...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isEditing ? 'Update Contact' : 'Save Contact'}
                          </>
                        )}
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'saved' && (
          <Card className="border shadow-sm text-center">
            <CardContent className="py-12 px-6">
              <div className="w-16 h-16 bg-success rounded-lg flex items-center justify-center mx-auto mb-6">
                <Save className="h-8 w-8 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">
                Contact Saved Successfully!
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                The contact information has been saved to your database.
              </p>
              <Button 
                onClick={handleReset} 
                className="px-8"
              >
                Scan Another Card
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Duplicate Contact Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Contact Detected</AlertDialogTitle>
            <AlertDialogDescription>
              A contact with the email "{duplicateContact?.email}" already exists ({duplicateContact?.full_name}). 
              Would you like to save this contact anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDuplicateDialog(false);
              setDuplicateContact(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowDuplicateDialog(false);
              setDuplicateContact(null);
              handleSave(true); // Force override
            }}>
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessCardScanner;