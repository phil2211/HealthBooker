exports.handler = async (event) => {
  console.log('Simple test function called');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Environment variables:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Simple test successful',
      timestamp: new Date().toISOString(),
      env: {
        mongodb: !!process.env.MONGODB_URI,
        jwt: !!process.env.JWT_SECRET
      }
    })
  };
};
