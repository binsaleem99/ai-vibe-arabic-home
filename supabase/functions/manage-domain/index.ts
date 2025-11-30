import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, projectId, domain, domainId } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN not configured');
    }

    // Get latest deployment for this project
    const { data: deployment } = await supabase
      .from('deployments')
      .select('vercel_deployment_id')
      .eq('project_id', projectId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!deployment?.vercel_deployment_id) {
      throw new Error('No active deployment found. Please deploy your project first.');
    }

    // Get project name for Vercel project lookup
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const projectName = project?.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (action === 'add') {
      console.log(`Adding domain ${domain} to project ${projectId}`);

      // Add domain to Vercel
      const vercelResponse = await fetch(
        `https://api.vercel.com/v9/projects/${projectName}/domains`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: domain }),
        }
      );

      if (!vercelResponse.ok) {
        const errorText = await vercelResponse.text();
        console.error('Vercel domain add error:', errorText);
        throw new Error(`Failed to add domain to Vercel: ${errorText}`);
      }

      const vercelData = await vercelResponse.json();

      // Create domain record
      const { data: domainRecord, error: domainError } = await supabase
        .from('domains')
        .insert({
          project_id: projectId,
          user_id: user.id,
          domain: domain,
          vercel_domain_id: vercelData.name,
          status: 'pending',
          verification_record: vercelData.verification?.[0]?.value || null,
        })
        .select()
        .single();

      if (domainError) {
        console.error('Domain record error:', domainError);
        throw new Error('Failed to create domain record');
      }

      return new Response(
        JSON.stringify({
          success: true,
          domain: domainRecord,
          verification: vercelData.verification,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'remove') {
      console.log(`Removing domain ${domainId}`);

      // Get domain details
      const { data: domainRecord } = await supabase
        .from('domains')
        .select('domain, vercel_domain_id')
        .eq('id', domainId)
        .eq('user_id', user.id)
        .single();

      if (!domainRecord) {
        throw new Error('Domain not found');
      }

      // Remove from Vercel
      const vercelResponse = await fetch(
        `https://api.vercel.com/v9/projects/${projectName}/domains/${domainRecord.domain}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      if (!vercelResponse.ok) {
        const errorText = await vercelResponse.text();
        console.error('Vercel domain remove error:', errorText);
      }

      // Delete domain record
      await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      console.log(`Verifying domain ${domainId}`);

      // Get domain details
      const { data: domainRecord } = await supabase
        .from('domains')
        .select('domain')
        .eq('id', domainId)
        .eq('user_id', user.id)
        .single();

      if (!domainRecord) {
        throw new Error('Domain not found');
      }

      // Check domain status in Vercel
      const vercelResponse = await fetch(
        `https://api.vercel.com/v9/projects/${projectName}/domains/${domainRecord.domain}`,
        {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        }
      );

      if (!vercelResponse.ok) {
        throw new Error('Failed to verify domain');
      }

      const vercelData = await vercelResponse.json();
      const isVerified = vercelData.verified;

      // Update domain status
      await supabase
        .from('domains')
        .update({
          status: isVerified ? 'active' : 'pending',
          ssl_enabled: isVerified,
        })
        .eq('id', domainId);

      return new Response(
        JSON.stringify({
          success: true,
          verified: isVerified,
          domain: vercelData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Domain management error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Domain management failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});