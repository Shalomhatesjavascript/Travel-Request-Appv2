import nodemailer from 'nodemailer';
import { query } from '../config/database';
import { TravelRequestWithUsers, NotificationType } from '../types';
import { formatDate, getFullName } from '../utils/helpers';

/**
 * Email Notification Service
 * 
 * Handles sending email notifications for travel request events.
 * Logs all notification attempts to the database.
 */

/**
 * Create Email Transporter
 * 
 * Configures nodemailer with SMTP settings from environment variables.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Log Notification
 * 
 * Records notification attempt in database.
 * 
 * @param requestId - Travel request ID
 * @param recipientEmail - Email address
 * @param notificationType - Type of notification
 * @param status - 'sent' or 'failed'
 * @param errorMessage - Error message if failed
 */
const logNotification = async (
  requestId: string,
  recipientEmail: string,
  notificationType: NotificationType,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> => {
  try {
    await query(
      `INSERT INTO notification_logs 
       (travel_request_id, recipient_email, notification_type, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [requestId, recipientEmail, notificationType, status, errorMessage || null]
    );
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
};

/**
 * Send Email
 * 
 * Sends an email and logs the result.
 * 
 * @param to - Recipient email
 * @param subject - Email subject
 * @param html - Email HTML content
 * @param requestId - Travel request ID (for logging)
 * @param notificationType - Type of notification
 */
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  requestId: string,
  notificationType: NotificationType
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Travel Request System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    console.log(`✉️  Email sent to ${to}: ${subject}`);
    await logNotification(requestId, to, notificationType, 'sent');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    await logNotification(
      requestId, 
      to, 
      notificationType, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return false;
  }
};

/**
 * Generate Email Template
 * 
 * Creates a styled HTML email template.
 */
const generateEmailTemplate = (content: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .details {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .detail-row {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
          font-weight: bold;
          color: #6b7280;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✈️ Travel Request System</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>This is an automated message from the Travel Request System.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send Request Submission Notification
 * 
 * Notifies approver when a new request is submitted.
 */
export const sendSubmissionNotification = async (
  request: TravelRequestWithUsers
): Promise<boolean> => {
  const approverName = getFullName(request.approver.first_name, request.approver.last_name);
  const requesterName = getFullName(request.user.first_name, request.user.last_name);
  
  const content = `
    <h2>New Travel Request Awaiting Your Approval</h2>
    <p>Hello ${approverName},</p>
    <p><strong>${requesterName}</strong> has submitted a new travel request that requires your approval.</p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Destination:</span> ${request.destination}
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure:</span> ${formatDate(new Date(request.departure_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Return:</span> ${formatDate(new Date(request.return_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Purpose:</span> ${request.purpose}
      </div>
      <div class="detail-row">
        <span class="detail-label">Estimated Budget:</span> $${request.estimated_budget.toFixed(2)}
      </div>
    </div>
    
    <p>
      <a href="${process.env.CLIENT_URL}/requests/${request.id}" class="button">
        Review Request
      </a>
    </p>
    
    <p>Please review and approve or reject this request at your earliest convenience.</p>
  `;
  
  return await sendEmail(
    request.approver.email,
    `New Travel Request from ${requesterName}`,
    generateEmailTemplate(content),
    request.id,
    'submission'
  );
};

/**
 * Send Request Approval Notification
 * 
 * Notifies requester when their request is approved.
 */
export const sendApprovalNotification = async (
  request: TravelRequestWithUsers
): Promise<boolean> => {
  const requesterName = getFullName(request.user.first_name, request.user.last_name);
  const approverName = getFullName(request.approver.first_name, request.approver.last_name);
  
  const content = `
    <h2>✅ Your Travel Request Has Been Approved</h2>
    <p>Hello ${requesterName},</p>
    <p>Great news! Your travel request has been <strong style="color: #10b981;">APPROVED</strong> by ${approverName}.</p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Destination:</span> ${request.destination}
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure:</span> ${formatDate(new Date(request.departure_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Return:</span> ${formatDate(new Date(request.return_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Budget:</span> $${request.estimated_budget.toFixed(2)}
      </div>
      ${request.approval_comments ? `
      <div class="detail-row">
        <span class="detail-label">Comments:</span> ${request.approval_comments}
      </div>
      ` : ''}
    </div>
    
    <p>
      <a href="${process.env.CLIENT_URL}/requests/${request.id}" class="button">
        View Request Details
      </a>
    </p>
    
    <p>You may now proceed with your travel arrangements.</p>
  `;
  
  return await sendEmail(
    request.user.email,
    '✅ Travel Request Approved',
    generateEmailTemplate(content),
    request.id,
    'approval'
  );
};

/**
 * Send Request Rejection Notification
 * 
 * Notifies requester when their request is rejected.
 */
export const sendRejectionNotification = async (
  request: TravelRequestWithUsers
): Promise<boolean> => {
  const requesterName = getFullName(request.user.first_name, request.user.last_name);
  const approverName = getFullName(request.approver.first_name, request.approver.last_name);
  
  const content = `
    <h2>❌ Your Travel Request Has Been Rejected</h2>
    <p>Hello ${requesterName},</p>
    <p>We regret to inform you that your travel request has been <strong style="color: #ef4444;">REJECTED</strong> by ${approverName}.</p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Destination:</span> ${request.destination}
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure:</span> ${formatDate(new Date(request.departure_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Return:</span> ${formatDate(new Date(request.return_date))}
      </div>
      ${request.approval_comments ? `
      <div class="detail-row">
        <span class="detail-label">Reason for Rejection:</span> ${request.approval_comments}
      </div>
      ` : ''}
    </div>
    
    <p>
      <a href="${process.env.CLIENT_URL}/requests/${request.id}" class="button">
        View Request Details
      </a>
    </p>
    
    <p>If you have questions about this decision, please contact ${approverName} directly.</p>
  `;
  
  return await sendEmail(
    request.user.email,
    '❌ Travel Request Rejected',
    generateEmailTemplate(content),
    request.id,
    'rejection'
  );
};

/**
 * Send Request Cancellation Notification
 * 
 * Notifies approver when requester cancels a pending request.
 */
export const sendCancellationNotification = async (
  request: TravelRequestWithUsers
): Promise<boolean> => {
  const approverName = getFullName(request.approver.first_name, request.approver.last_name);
  const requesterName = getFullName(request.user.first_name, request.user.last_name);
  
  const content = `
    <h2>Travel Request Cancelled</h2>
    <p>Hello ${approverName},</p>
    <p><strong>${requesterName}</strong> has cancelled their travel request.</p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Destination:</span> ${request.destination}
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure:</span> ${formatDate(new Date(request.departure_date))}
      </div>
      <div class="detail-row">
        <span class="detail-label">Return:</span> ${formatDate(new Date(request.return_date))}
      </div>
    </div>
    
    <p>No action is required from you. This request has been removed from your pending approvals.</p>
  `;
  
  return await sendEmail(
    request.approver.email,
    `Travel Request Cancelled by ${requesterName}`,
    generateEmailTemplate(content),
    request.id,
    'cancellation'
  );
};