import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OCR request received, method:', req.method);
    
    let formData;
    try {
      formData = await req.formData();
    } catch (formError) {
      console.error('Form data parsing error:', formError);
      return new Response(JSON.stringify({ error: 'Invalid form data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const imageFile = formData.get('image') as File;
    const sourceUser = formData.get('source_user') as string || '';
    const cardType = formData.get('card_type') as string || 'auto';

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing OCR request for file: ${imageFile.name}, size: ${imageFile.size}`);

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 safely for large images
    let binaryString = '';
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Image = btoa(binaryString);
    const mimeType = imageFile.type;

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent card OCR system that can detect and extract information from both business cards and prospect cards (university application forms). First determine the card type, then extract and parse accordingly.

CARD TYPE DETECTION:
- Business Card: Contains business information like company name, job title, professional contact details
- Prospect Card: Contains personal/educational information like gender checkboxes, date of birth, school information, university entry details

IMPORTANT: If any text is in a language other than English, translate it to English while preserving the original meaning.

Return your response as a JSON object with:
1. "raw_text": The complete text you can see on the card
2. "card_type": Either "business_card" or "prospect_card" (auto-detected)
3. "parsed": An object with fields based on card type:

FOR BUSINESS CARDS:
   - card_type: "business_card"
   - full_name: person's name
   - title: job title/position  
   - company: company/organization name
   - email: email address
   - phone: phone number
   - address_line: street address
   - city: city name
   - state_region: state/province/region
   - postal_code: zip/postal code
   - country: country
   - notes: any additional information
   - source_user: (leave empty)

FOR PROSPECT CARDS:
   - card_type: "prospect_card"
   - gender: "Male" or "Female" (from checkbox)
   - first_name: first/given name
   - middle_name: middle name
   - last_name: last/family name
   - preferred_first_name: preferred name or nickname
   - date_of_birth: birth date (YYYY-MM-DD format if possible)
   - email: primary email address
   - email_confirmation: confirmation email (if different)
   - country_of_citizenship: country of citizenship
   - current_school: current school name
   - year_entering_university: intended university entry year
   - entry_status: "First Year" or "Transfer"
   - notes: any additional information
   - source_user: (leave empty)
   - full_name: concatenated first + middle + last name for compatibility
   
4. "detected_language": The primary language detected
5. "translations_made": true/false - whether translations were performed

${cardType !== 'auto' ? `USER SPECIFIED CARD TYPE: ${cardType === 'business_card' ? 'Business Card' : 'Prospect Card'} - prioritize this type unless clearly incorrect.` : ''}

Be conservative - only extract information you're confident about. Use empty strings for missing fields.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and determine if it\'s a business card or prospect card, then extract and parse the information accordingly.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('OpenAI raw response:', aiResponse);

    // Parse the JSON response from OpenAI
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      // Fallback: try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    // Ensure all required fields exist in parsed data
    const detectedCardType = parsedResponse.card_type || 'business_card';
    
    const defaultParsed: ContactData = {
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
      source_user: sourceUser,
      card_type: detectedCardType,
      // Prospect card fields
      gender: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      preferred_first_name: '',
      date_of_birth: '',
      email_confirmation: '',
      country_of_citizenship: '',
      current_school: '',
      year_entering_university: '',
      entry_status: ''
    };

    const finalParsed = { ...defaultParsed, ...parsedResponse.parsed, source_user: sourceUser };

    const result = {
      raw_text: parsedResponse.raw_text || '',
      parsed: finalParsed,
      detected_language: parsedResponse.detected_language || 'English',
      translations_made: parsedResponse.translations_made || false,
      card_type: detectedCardType
    };

    console.log('Successfully processed OCR:', { 
      raw_text_length: result.raw_text.length,
      parsed_fields: Object.keys(result.parsed).filter(key => result.parsed[key as keyof ContactData]),
      detected_language: result.detected_language,
      translations_made: result.translations_made
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OCR extraction:', error);
    return new Response(JSON.stringify({ 
      error: 'OCR extraction failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});