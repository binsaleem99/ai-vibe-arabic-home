import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, messages, mode } = await req.json();

    console.log('Generate code request:', { projectId, messageCount: messages.length, mode });

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Build conversation with system prompt
    const systemPrompt = `You are an expert code generator for AI Vibe Coder. Generate clean, functional, and well-documented code based on user requirements. 

Guidelines:
- Write production-ready code with proper error handling
- Include clear comments in Arabic when appropriate
- Follow best practices for the requested technology
- Provide complete, runnable code examples
- Use modern syntax and patterns
- Keep code modular and maintainable

Output format:
- Return only the code without additional explanations
- Use proper indentation and formatting
- Include necessary imports and dependencies`;

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek response received');
    
    const generatedCode = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        code: generatedCode,
        model: 'deepseek-chat',
        projectId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate code',
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
