import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Create a transporter based on environment
const createTransporter = () => {

  return nodemailer.createTransport({
    service:process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export const generateMagicLinkToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

export const sendMagicLinkEmail = async (
  email: string,
  token: string,
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
) => {
  const transporter = createTransporter()
  
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@buyerlead.com',
    to: email,
    subject: 'Sign in to Buyer Lead App',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Buyer Lead App</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Buyer Lead App</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-bottom: 30px;">Sign in to your account</h2>
            
            <p style="font-size: 16px; margin-bottom: 30px; color: #6c757d;">
              Click the button below to sign in to your Buyer Lead App account. This link will expire in 15 minutes.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${magicLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 50px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Sign In to Buyer Lead App
              </a>
            </div>
            
            <p style="font-size: 14px; color: #868e96; margin-top: 40px;">
              If you didn't request this email, you can safely ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #adb5bd; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #667eea; word-break: break-all;">${magicLink}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Sign in to Buyer Lead App
      
      Click the link below to sign in to your account:
      ${magicLink}
      
      This link will expire in 15 minutes.
      
      If you didn't request this email, you can safely ignore it.
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Magic link email sent!')
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
      console.log('Magic link:', magicLink)
    }
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending magic link email:', error)
    return { success: false, error }
  }
} 