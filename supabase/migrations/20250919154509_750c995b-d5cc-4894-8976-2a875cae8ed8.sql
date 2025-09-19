-- Add card_type field to contacts table
ALTER TABLE public.contacts ADD COLUMN card_type text DEFAULT 'business_card';

-- Add prospect card specific fields
ALTER TABLE public.contacts ADD COLUMN gender text;
ALTER TABLE public.contacts ADD COLUMN first_name text;
ALTER TABLE public.contacts ADD COLUMN middle_name text;
ALTER TABLE public.contacts ADD COLUMN last_name text;
ALTER TABLE public.contacts ADD COLUMN preferred_first_name text;
ALTER TABLE public.contacts ADD COLUMN date_of_birth date;
ALTER TABLE public.contacts ADD COLUMN email_confirmation text;
ALTER TABLE public.contacts ADD COLUMN country_of_citizenship text;
ALTER TABLE public.contacts ADD COLUMN current_school text;
ALTER TABLE public.contacts ADD COLUMN year_entering_university text;
ALTER TABLE public.contacts ADD COLUMN entry_status text;