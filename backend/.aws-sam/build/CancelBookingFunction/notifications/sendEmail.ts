import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Booking, Therapist } from '../../layers';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@healthbooker.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create SES client
const sesClient = new SESClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

export const sendBookingConfirmationEmail = async (
  booking: Booking,
  therapist: Therapist
): Promise<void> => {
  const cancellationUrl = `${BASE_URL}/cancel/${booking.cancellationToken}`;
  
  const patientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Confirmed</h2>
      <p>Dear ${booking.patientName},</p>
      <p>Your appointment has been confirmed with ${therapist.name}.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Therapist:</strong> ${therapist.name}</p>
        <p><strong>Specialization:</strong> ${therapist.specialization}</p>
      </div>
      
      <p>If you need to cancel this appointment, please do so at least 24 hours in advance:</p>
      <a href="${cancellationUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Cancel Appointment</a>
      
      <p>Thank you for choosing our services!</p>
    </div>
  `;

  const therapistEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Appointment Booking</h2>
      <p>You have a new appointment booking.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Patient:</strong> ${booking.patientName}</p>
        <p><strong>Email:</strong> ${booking.patientEmail}</p>
        <p><strong>Phone:</strong> ${booking.patientPhone}</p>
      </div>
    </div>
  `;

  // Send email to patient
  const patientCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [booking.patientEmail] },
    Message: {
      Subject: { Data: `Appointment Confirmed with ${therapist.name}` },
      Body: { Html: { Data: patientEmailHtml } }
    }
  });
  await sesClient.send(patientCommand);

  // Send email to therapist
  const therapistCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [therapist.email] },
    Message: {
      Subject: { Data: `New Appointment Booking - ${booking.patientName}` },
      Body: { Html: { Data: therapistEmailHtml } }
    }
  });
  await sesClient.send(therapistCommand);
};

export const sendCancellationEmail = async (
  booking: Booking,
  therapist: Therapist
): Promise<void> => {
  const patientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Cancelled</h2>
      <p>Dear ${booking.patientName},</p>
      <p>Your appointment with ${therapist.name} has been cancelled.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Therapist:</strong> ${therapist.name}</p>
      </div>
      
      <p>If you would like to book a new appointment, please visit our booking page.</p>
      <p>Thank you!</p>
    </div>
  `;

  const therapistEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Cancelled</h2>
      <p>An appointment has been cancelled.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Patient:</strong> ${booking.patientName}</p>
        <p><strong>Email:</strong> ${booking.patientEmail}</p>
      </div>
    </div>
  `;

  // Send email to patient
  const patientCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [booking.patientEmail] },
    Message: {
      Subject: { Data: `Appointment Cancelled - ${therapist.name}` },
      Body: { Html: { Data: patientEmailHtml } }
    }
  });
  await sesClient.send(patientCommand);

  // Send email to therapist
  const therapistCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [therapist.email] },
    Message: {
      Subject: { Data: `Appointment Cancelled - ${booking.patientName}` },
      Body: { Html: { Data: therapistEmailHtml } }
    }
  });
  await sesClient.send(therapistCommand);
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
