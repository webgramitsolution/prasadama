
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: 'INSTAGRAM_ACCESS_TOKEN not set',
          message: 'Instagram Access Token is missing. Please add it to your Backend Secrets.',
          length: 0
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { type, after, limit = '12' } = await req.json()

    // Test connection
    if (type === 'test') {
      const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        return new Response(
          JSON.stringify({ 
            status: 'failed', 
            message: data.error.message || 'Instagram API error' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          status: 'success', 
          username: data.username 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch feed
    let url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${accessToken}`
    
    if (after) {
      url += `&after=${after}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || data.error) {
      const igError = data?.error ?? {}
      console.error(
        `Instagram media request failed [${response.status}]:`,
        JSON.stringify(igError),
      )
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch Instagram media.',
          message: igError.message || `Instagram API returned ${response.status}.`,
          type: igError.type,
          code: igError.code,
          error_subcode: igError.error_subcode,
          status: response.status,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
