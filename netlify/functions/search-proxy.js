/**
 * Netlify Function - Start async search
 * Uses /search/async endpoint for long-running searches
 */

const RAILWAY_API = 'https://pharmyrus-total35-production-5392.up.railway.app'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    }
  }

  try {
    const body = JSON.parse(event.body)
    console.log('🔍 Starting async search:', body)

    // Use /search/async endpoint (returns job_id immediately)
    const response = await fetch(`${RAILWAY_API}/search/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_molecula: body.molecule,
        nome_comercial: body.brand || '',
        paises_alvo: body.countries || ['BR'],
        incluir_wo: true
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ FastAPI error:', errorText)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'FastAPI error', details: errorText })
      }
    }

    const data = await response.json()
    console.log('✅ Job created:', data.job_id)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal error', message: error.message })
    }
  }
}
