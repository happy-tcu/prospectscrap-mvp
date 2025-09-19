import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Scan, Save, User, Building, Mail, Phone, MapPin, FileText, Loader2 } from 'lucide-react';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const mockOCRExtraction = (file: File): Promise<{ raw_text: string; parsed: ContactData }> => {
    return new Promise((resolve) => {
      // Mock OCR response for demo
      setTimeout(() => {
        const mockData = {
          raw_text: "ACME CORPORATION\nJane Smith\nSenior Product Manager\njane.smith@acme.com\n+1 (555) 123-4567\n123 Business Ave, Suite 100\nSan Francisco, CA 94105",
          parsed: {
            full_name: "Jane Smith",
            title: "Senior Product Manager", 
            company: "ACME CORPORATION",
            email: "jane.smith@acme.com",
            phone: "+1 (555) 123-4567",
            address_line: "123 Business Ave, Suite 100",
            city: "San Francisco",
            state_region: "CA",
            postal_code: "94105",
            country: "USA",
            notes: "",
            source_user: ""
          }
        };
        resolve(mockData);
      }, 2000);
    });
  };

  const handleExtractFields = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      const result = await mockOCRExtraction(selectedFile);
      setRawText(result.raw_text);
      setContactData(result.parsed);
      setStep('review');
      toast({
        title: "Fields extracted successfully",
        description: "Review and edit the extracted information below."
      });
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: "Could not extract fields from the business card.",
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
    setIsSaving(true);
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random duplicate check
      const isDuplicate = Math.random() < 0.3;
      
      if (isDuplicate) {
        toast({
          title: "Duplicate contact detected",
          description: "This contact already exists in the database.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Contact saved successfully",
          description: "The business card information has been added to your database."
        });
        setStep('saved');
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save the contact information.",
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
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Business Card Scanner
          </h1>
          <p className="text-muted-foreground text-lg">
            Capture, extract, and save contact information instantly
          </p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scan Business Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedFile ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleCameraCapture}
                    variant="default"
                    size="lg"
                    className="flex-1 h-16"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    onClick={handleFileUpload}
                    variant="secondary"
                    size="lg"
                    className="flex-1 h-16"
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    Upload Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-gradient-card">
                    <img
                      src={previewUrl}
                      alt="Business card preview"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleExtractFields}
                      disabled={isProcessing}
                      className="flex-1"
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
                    <Button onClick={handleReset} variant="outline">
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
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Raw OCR Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{rawText}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={contactData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={contactData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={contactData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={contactData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address_line" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address_line"
                    value={contactData.address_line}
                    onChange={(e) => handleInputChange('address_line', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={contactData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state_region">State</Label>
                    <Input
                      id="state_region"
                      value={contactData.state_region}
                      onChange={(e) => handleInputChange('state_region', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      value={contactData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={contactData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
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
                  <Button onClick={handleReset} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'saved' && (
          <Card className="shadow-card text-center">
            <CardContent className="py-12">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <Save className="h-8 w-8 text-success-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Contact Saved Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                The business card information has been added to your database.
              </p>
              <Button onClick={handleReset} className="px-8">
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