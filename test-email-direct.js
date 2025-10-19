const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Test email sending directly
const testEmailSending = async () => {
  console.log('Testing email sending...');
  
  const FROM_EMAIL = 'philip@eschenbacher.ch';
  const AWS_REGION = 'eu-central-1';
  
  console.log('FROM_EMAIL:', FROM_EMAIL);
  console.log('AWS_REGION:', AWS_REGION);
  
  const sesClient = new SESClient({ 
    region: AWS_REGION 
  });
  
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: ['philip@eschenbacher.ch'] },
    Message: {
      Subject: { Data: 'Test Email from Application' },
      Body: { 
        Html: { 
          Data: '<h1>Test Email</h1><p>This is a test email sent from the application.</p>' 
        } 
      }
    }
  });
  
  try {
    const result = await sesClient.send(command);
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Run the test
testEmailSending()
  .then(result => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
