const RAILWAY_API = 'https://pharmyrus-total36-production-81ca.up.railway.app'

exports.handler = async (event) => {
  const jobId = event.queryStringParameters?.job_id
  
  if (!jobId) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'job_id required' }) 
    }
  }

  try {
    const response = await fetch(`${RAILWAY_API}/search/result/${jobId}`)
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Result fetch failed' })
      }
    }

    const data = await response.json()
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
