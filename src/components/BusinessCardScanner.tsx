import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ContactsList from '@/components/ContactsList';
import { Camera, Upload, Scan, Save, User, Building, Mail, Phone, MapPin, FileText, Loader2, LogOut, List, Globe } from 'lucide-react';

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
    source_user: ''
  });
  const [step, setStep] = useState<'upload' | 'review' | 'saved'>('upload');
  const [showContacts, setShowContacts] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [translationsMade, setTranslationsMade] = useState<boolean>(false);
  
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
    return <ContactsList onBack={() => setShowContacts(false)} />;
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
  }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('source_user', user?.email || '');

    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: formData
    });

    if (error) {
      console.error('OCR Error:', error);
      throw new Error(error.message || 'OCR extraction failed');
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
      
      const toastMessage = result.translations_made 
        ? `Fields extracted and translated from ${result.detected_language} to English`
        : "Fields extracted successfully";
      
      toast({
        title: "Extraction completed",
        description: toastMessage
      });
    } catch (error) {
      console.error('OCR extraction error:', error);
      toast({
        title: "Extraction failed",
        description: "Could not extract fields from the business card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check for duplicates by email or phone
      const { data: existingContacts, error: searchError } = await supabase
        .from('contacts')
        .select('id, email, phone')
        .eq('user_id', user.id)
        .or(`email.eq.${contactData.email},phone.eq.${contactData.phone}`)
        .limit(1);

      if (searchError) {
        throw searchError;
      }

      if (existingContacts && existingContacts.length > 0) {
        toast({
          title: "Duplicate contact detected",
          description: "A contact with this email or phone already exists.",
          variant: "destructive"
        });
        return;
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
        description: "The business card information has been added to your database."
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
      source_user: ''
    });
    setDetectedLanguage('');
    setTranslationsMade(false);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 sm:py-8">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Business Card Scanner
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              Capture, extract, and save contact information instantly
            </p>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
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
          <Card className="shadow-card">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Scan className="h-4 w-4 sm:h-5 sm:w-5" />
                Scan Business Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
              {!selectedFile ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  <Button
                    onClick={handleCameraCapture}
                    variant="default"
                    size="lg"
                    className="w-full h-14 sm:h-16"
                  >
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    onClick={handleFileUpload}
                    variant="secondary"
                    size="lg"
                    className="w-full h-14 sm:h-16"
                  >
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Upload Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-gradient-card">
                    <img
                      src={previewUrl}
                      alt="Business card preview"
                      className="w-full h-48 sm:h-64 object-contain"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={handleExtractFields}
                      disabled={isProcessing}
                      className="flex-1 w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Extract Fields
                        </>
                      )}
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Raw OCR Text */}
            <Card className="shadow-card">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">Raw OCR Text</CardTitle>
                {translationsMade && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    Translated from {detectedLanguage} to English
                  </div>
                )}
                {!translationsMade && detectedLanguage !== 'English' && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    Detected language: {detectedLanguage}
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="bg-muted p-3 sm:p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm">{rawText}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card className="shadow-card">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
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

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Contact
                      </>
                    )}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'saved' && (
          <Card className="shadow-card text-center">
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <Save className="h-6 w-6 sm:h-8 sm:w-8 text-success-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2">Contact Saved Successfully!</h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                The business card information has been added to your database.
              </p>
              <Button onClick={handleReset} className="px-6 sm:px-8 w-full sm:w-auto">
                Scan Another Card
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessCardScanner;