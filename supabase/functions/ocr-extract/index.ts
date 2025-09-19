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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
            content: `You are a business card OCR system. Extract text from business cards and parse the information into structured JSON format. 

Return your response as a JSON object with:
1. "raw_text": The complete text you can see on the business card
2. "parsed": An object with these exact fields (use empty strings if not found):
   - full_name: person's name
   - title: job title/position
   - company: company/organization name
   - email: email address
   - phone: phone number (normalize if possible)
   - address_line: street address
   - city: city name
   - state_region: state/province/region
   - postal_code: zip/postal code
   - country: country (if specified, otherwise empty)
   - notes: any additional relevant information
   - source_user: (leave empty, will be filled by system)

Be conservative - only extract information you're confident about. Use empty strings for missing fields.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract and parse the information from this business card image.'
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
      throw new Error(`OpenAI API error: ${response.status}`);
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
      source_user: sourceUser
    };

    const finalParsed = { ...defaultParsed, ...parsedResponse.parsed, source_user: sourceUser };

    const result = {
      raw_text: parsedResponse.raw_text || '',
      parsed: finalParsed
    };

    console.log('Successfully processed OCR:', { 
      raw_text_length: result.raw_text.length,
      parsed_fields: Object.keys(result.parsed).filter(key => result.parsed[key as keyof ContactData])
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