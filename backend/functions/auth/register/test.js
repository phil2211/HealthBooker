const { connectToDatabase } = require('./layers');

exports.handler = async (event) => {
  console.log('Test function called');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Environment variables:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
  try {
    await connectToDatabase();
    console.log('Database connection successful');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Test successful',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
