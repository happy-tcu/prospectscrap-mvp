import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ContactsList from '@/components/ContactsList';
import { Camera, Upload, Scan, Save, User, Building, Mail, Phone, MapPin, FileText, Loader2, LogOut, List, Globe, CreditCard, GraduationCap } from 'lucide-react';

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
    card_type?: string;
  }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('source_user', user?.email || '');
    formData.append('card_type', cardType);

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
      toast({
        title: "Extraction failed",
        description: "Could not extract fields from the card. Please try again.",
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
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 sm:py-8 animate-fade-in">
          <div className="text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-cyberpunk rounded-xl flex items-center justify-center shadow-neon animate-glow-rotate">
                <Scan className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent neon-text">
                Neural Scanner
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-lg">
              AI-powered OCR with quantum processing capabilities
            </p>
          </div>
          <div className="flex gap-3 justify-center sm:justify-end">
            <Button 
              onClick={() => setShowContacts(true)} 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none bg-muted/30 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:shadow-glow"
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline ml-2">Neural Database</span>
              <span className="sm:hidden ml-2">Database</span>
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none bg-muted/30 border-destructive/30 hover:bg-destructive/10 hover:border-destructive transition-all duration-300"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline ml-2">Disconnect</span>
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
          <div className="cyber-card rounded-2xl animate-scale-in">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Scan className="h-4 w-4 text-white" />
                </div>
                Initialize Scan Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Card Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground/90">Target Classification</Label>
                <RadioGroup value={cardType} onValueChange={(value) => setCardType(value as 'auto' | 'business_card' | 'prospect_card')} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Scan className="h-4 w-4 text-primary" />
                      Auto-detect
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-secondary/30 hover:border-secondary/60 transition-colors cursor-pointer">
                    <RadioGroupItem value="business_card" id="business" />
                    <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4 text-secondary" />
                      Business Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-accent/30 hover:border-accent/60 transition-colors cursor-pointer">
                    <RadioGroupItem value="prospect_card" id="prospect" />
                    <Label htmlFor="prospect" className="flex items-center gap-2 cursor-pointer flex-1">
                      <GraduationCap className="h-4 w-4 text-accent" />
                      Prospect Card
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {!selectedFile ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="text-center py-8 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-card hover:border-primary/60 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-cyberpunk rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow animate-float">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-muted-foreground mb-6">Ready to capture digital intelligence</p>
                    <div className="flex flex-col gap-3 px-4">
                      <Button
                        onClick={handleCameraCapture}
                        size="lg"
                        className="w-full h-14 bg-gradient-primary hover:bg-gradient-neon shadow-glow hover:shadow-neon transition-all duration-300 font-semibold"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Activate Scanner
                      </Button>
                      <Button
                        onClick={handleFileUpload}
                        variant="outline"
                        size="lg"
                        className="w-full h-14 bg-muted/20 border-secondary/30 hover:border-secondary hover:bg-secondary/10 transition-all duration-300"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload from Archive
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                  <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-card shadow-cyberpunk">
                    <div className="absolute inset-0 bg-gradient-neon opacity-10"></div>
                    <img
                      src={previewUrl}
                      alt="Scanned document preview"
                      className="relative w-full h-48 sm:h-64 object-contain z-10"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={handleExtractFields}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-primary hover:bg-gradient-neon shadow-glow hover:shadow-neon transition-all duration-300 font-semibold"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Neural Network...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Initiate Quantum Analysis
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleReset} 
                      variant="outline" 
                      className="bg-muted/20 border-muted-foreground/30 hover:border-muted-foreground hover:bg-muted/40 transition-all duration-300"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        )}

        {step === 'review' && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in">
            {/* Raw OCR Text */}
            <div className="cyber-card rounded-2xl">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Neural Network Output
                </CardTitle>
                {translationsMade && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-accent">
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
                <div className="bg-muted/30 p-4 rounded-xl border border-primary/20 shadow-inner">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-foreground/90 font-mono">{rawText}</pre>
                </div>
              </CardContent>
            </div>

            {/* Editable Fields */}
            <div className="cyber-card rounded-2xl">
              <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Data Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-4 sm:pb-6">
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

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-primary hover:bg-gradient-neon shadow-glow hover:shadow-neon transition-all duration-300 font-semibold"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading to Database...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Commit to Neural Network
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="bg-muted/20 border-muted-foreground/30 hover:border-muted-foreground hover:bg-muted/40 transition-all duration-300"
                  >
                    Abort
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        )}

        {step === 'saved' && (
          <div className="cyber-card rounded-2xl text-center animate-scale-in">
            <CardContent className="py-12 sm:py-16 px-4 sm:px-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow animate-float">
                <Save className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
                Neural Upload Complete!
              </h3>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-md mx-auto">
                Data has been successfully integrated into the quantum database matrix.
              </p>
              <Button 
                onClick={handleReset} 
                className="px-8 sm:px-12 bg-gradient-primary hover:bg-gradient-neon shadow-glow hover:shadow-neon transition-all duration-300 font-semibold"
              >
                Initialize New Scan
              </Button>
            </CardContent>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCardScanner;