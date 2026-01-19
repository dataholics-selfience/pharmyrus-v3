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
    console.log('📊 Checking status for job:', jobId)
    
    const response = await fetch(`${RAILWAY_API}/search/status/${jobId}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Status check failed:', response.status, errorText)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Status check failed', details: errorText })
      }
    }

    const data = await response.json()
    console.log('✅ Status data:', JSON.stringify(data))
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
