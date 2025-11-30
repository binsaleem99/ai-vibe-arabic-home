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
    const { projectId } = await req.json();
    
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

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Deploying project ${projectId} for user ${user.id}`);

    // Get latest generated code
    const { data: generatedApp, error: codeError } = await supabase
      .from('generated_apps')
      .select('code')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeError || !generatedApp) {
      throw new Error('No generated code found');
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: 'building',
      })
      .select()
      .single();

    if (deploymentError) {
      console.error('Deployment record error:', deploymentError);
      throw new Error('Failed to create deployment record');
    }

    console.log(`Created deployment record: ${deployment.id}`);

    // Deploy to Vercel
    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN not configured');
    }

    // Create Vercel deployment
    const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        files: [
          {
            file: 'index.html',
            data: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${generatedApp.code}
  </script>
</body>
</html>`
          }
        ],
        projectSettings: {
          framework: null,
        },
      }),
    });

    if (!vercelResponse.ok) {
      const errorText = await vercelResponse.text();
      console.error('Vercel deployment error:', errorText);
      
      await supabase
        .from('deployments')
        .update({ 
          status: 'failed',
          error_message: `Vercel API error: ${errorText}`
        })
        .eq('id', deployment.id);

      throw new Error('Vercel deployment failed');
    }

    const vercelData = await vercelResponse.json();
    console.log('Vercel deployment response:', vercelData);

    // Update deployment with Vercel info
    await supabase
      .from('deployments')
      .update({
        vercel_deployment_id: vercelData.id,
        vercel_url: vercelData.url,
        status: 'ready',
      })
      .eq('id', deployment.id);

    console.log(`Deployment successful: https://${vercelData.url}`);

    return new Response(
      JSON.stringify({
        success: true,
        deploymentId: deployment.id,
        url: `https://${vercelData.url}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Deploy error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Deployment failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});