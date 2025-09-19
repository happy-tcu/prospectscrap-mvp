-- Create contacts table for storing business card and prospect card data
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Core contact information
  full_name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  
  -- Address information
  address_line TEXT,
  city TEXT,
  state_region TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Metadata
  notes TEXT,
  source_user TEXT,
  card_type TEXT NOT NULL DEFAULT 'business',
  raw_ocr_text TEXT,
  
  -- Prospect card specific fields (optional)
  gender TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  preferred_first_name TEXT,
  date_of_birth TEXT,
  email_confirmation TEXT,
  country_of_citizenship TEXT,
  current_school TEXT,
  year_entering_university TEXT,
  entry_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_card_type ON public.contacts(card_type);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at);
CREATE INDEX idx_contacts_full_name ON public.contacts(full_name);
CREATE INDEX idx_contacts_company ON public.contacts(company);