-- Add event and school organization fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN event_name TEXT,
ADD COLUMN school_name TEXT,
ADD COLUMN event_date DATE,
ADD COLUMN batch_id UUID;