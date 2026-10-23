# Payment System Setup Guide

This guide covers the setup and configuration of the comprehensive payment system in LearnTrack.

## Environment Variables

### Required Environment Variables

Add the following environment variables to your `.env` file:

#### Stripe Configuration
```env
# Stripe Secret Key (Backend)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Stripe Publishable Key (Frontend - add to client/.env)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

#### PayPal Configuration (Optional)
```env
# PayPal Client ID
PAYPAL_CLIENT_ID=your_paypal_client_id_here

# PayPal Client Secret
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# PayPal Environment (sandbox or live)
PAYPAL_ENVIRONMENT=sandbox
```

#### Application URLs
```env
# Client URL for redirects
CLIENT_URL=http://localhost:3000

# Server URL
SERVER_URL=http://localhost:5000
```

#### AWS S3 Configuration (for receipt uploads)
```env
# AWS S3 Configuration (if not already configured)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

## Payment System Features

### 1. Payment Methods Supported
- **Stripe**: Credit/Debit card payments with automatic enrollment
- **PayPal**: PayPal payments with automatic enrollment
- **Direct Bank Transfer**: Manual bank transfer with receipt upload and admin approval

### 2. Admin Features
- **Payment Settings**: Configure fees, deduction percentages, and gateway settings
- **Payment Dashboard**: View payment statistics, approve/reject direct transfers
- **Gateway Testing**: Test Stripe and PayPal connections
- **Automatic Enrollment**: Configure auto-enrollment for different payment methods

### 3. Student Features
- **Payment Page**: Unified payment interface with multiple payment options
- **Bills Dashboard**: View outstanding bills and payment history
- **Receipt Upload**: Upload payment receipts for direct bank transfers
- **Payment Status Tracking**: Track payment status and enrollment

## Database Models

### Course Model Extensions
- `price`: Course price (Number)
- `discountPercentage`: Discount percentage (Number, 0-100)
- `isFree`: Boolean flag for free courses
- `finalPrice`: Virtual field calculating price after discount

### User Model Extensions
- `isFreeAccount`: Boolean flag for free account users
- `bills`: Array of billing information with status tracking

### Payment Model
- Comprehensive payment tracking with multiple payment methods
- Admin fee calculations and instructor amount tracking
- Receipt upload support with S3 integration
- Payment gateway integration (Stripe, PayPal)

### AdminSettings Model
- Payment gateway configuration
- Fee structure settings
- Auto-enrollment preferences
- Currency and minimum payment settings

## API Endpoints

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment for a course
- `POST /api/payments/stripe/confirm` - Confirm Stripe payment
- `POST /api/payments/direct-transfer` - Submit direct transfer with receipt
- `POST /api/payments/:id/approve` - Admin approve/reject direct transfer

### User Endpoints
- `GET /api/payments/user/bills` - Get user bills and payment history
- `GET /api/payments/my-payments` - Get user payments
- `GET /api/payments/my-bills` - Get user bills

### Admin Endpoints
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings/payment` - Update payment settings
- `GET /api/admin/settings/payment-stats` - Get payment statistics
- `GET /api/payments/admin/pending-transfers` - Get pending direct transfers
- `POST /api/admin/settings/test-gateway` - Test payment gateway connection

## Frontend Routes

### Public Routes
- `/payment/:courseId` - Payment page for course enrollment

### Admin Routes
- `/admin/payments` - Payment dashboard and management
- `/admin/payment-settings` - Payment configuration settings

### Student Routes
- Student dashboard includes Bills & Payments section automatically

## Setup Instructions

### 1. Install Dependencies

#### Server Dependencies
```bash
cd server
npm install stripe multer
```

#### Client Dependencies
```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configure Environment Variables
- Copy the environment variables above to your `.env` files
- Replace placeholder values with your actual API keys

### 3. Database Migration
The models will automatically create the necessary fields when you restart the server. No manual migration is required.

### 4. Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Add the keys to your environment variables
4. Test the connection using the admin payment settings page

### 5. PayPal Setup (Optional)
1. Create a PayPal developer account
2. Create a new application to get client ID and secret
3. Add credentials to environment variables
4. Test the connection using the admin payment settings page

### 6. AWS S3 Setup (for receipt uploads)
1. Ensure your AWS S3 bucket is configured
2. Update CORS settings to allow uploads from your client domain
3. Verify upload permissions are properly set

## Testing the Payment System

### 1. Test Stripe Integration
- Use Stripe test card numbers (4242424242424242)
- Test successful and failed payments
- Verify automatic enrollment after successful payment

### 2. Test Direct Transfer
- Upload a test receipt (image or PDF)
- Verify admin can approve/reject transfers
- Test enrollment after admin approval

### 3. Test Admin Features
- Configure payment settings
- Test gateway connections
- Review payment statistics and reports

## Security Considerations

### 1. API Key Security
- Never expose secret keys in client-side code
- Use environment variables for all sensitive data
- Rotate keys regularly

### 2. File Upload Security
- Receipt uploads are limited to 5MB
- Only images and PDFs are allowed
- Files are stored securely in S3

### 3. Payment Validation
- All payments are verified server-side
- Stripe webhooks ensure payment integrity
- Admin approval required for direct transfers

## Troubleshooting

### Common Issues

#### 1. Stripe Connection Failed
- Verify STRIPE_SECRET_KEY is correct
- Check if key is for the right environment (test/live)
- Ensure key has proper permissions

#### 2. Receipt Upload Failed
- Check AWS S3 configuration
- Verify file size is under 5MB
- Ensure file type is image or PDF

#### 3. Payment Not Processing
- Check browser console for errors
- Verify all required environment variables are set
- Check server logs for detailed error messages

#### 4. Auto-enrollment Not Working
- Verify payment status is 'paid'
- Check admin settings for auto-enrollment configuration
- Review payment controller logs

## Critical Security Implementation

### 8. Common Security Mistakes (AVOID THESE)

**❌ NEVER DO:**
1. **Trust client for price or isFree flags** - Always fetch from database server-side
2. **Skip webhook implementation** - Required for production payment verification
3. **Ignore webhook signature verification** - Critical for preventing payment fraud
4. **Use express.json() for webhook routes** - Prevents proper signature verification
5. **Skip session ID mapping in database** - Makes payment reconciliation impossible
6. **Return secrets to client** - Never expose API keys, session objects, or sensitive data

**✅ SECURITY FIXES IMPLEMENTED:**

1. **Server-side Price Validation:**
   ```javascript
   // ✅ CORRECT: Get price from database
   const course = await Course.findById(courseId);
   const amount = course.isFree ? 0 : course.finalPrice;
   
   // ❌ WRONG: Trust client data
   // const { amount } = req.body; // NEVER DO THIS
   ```

2. **Webhook Implementation:**
   ```javascript
   // ✅ Separate webhook controller with signature verification
   // File: server/controllers/webhookController.js
   const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
   ```

3. **Raw Body Middleware:**
   ```javascript
   // ✅ Webhook routes bypass express.json() for signature verification
   // File: server/routes/webhookRoutes.js
   app.use("/api/webhooks", webhookRoutes); // BEFORE express.json()
   ```

4. **Session Mapping:**
   ```javascript
   // ✅ Store session ID in database for webhook processing
   payment.stripeSessionId = session.id;
   payment.stripePaymentIntentId = session.payment_intent;
   ```

5. **Client Response Security:**
   ```javascript
   // ✅ CORRECT: Only return necessary data
   res.json({
     sessionId: session.id,
     url: session.url,
     paymentId: payment._id
   });
   
   // ❌ WRONG: Never return full session object
   // res.json({ session }); // Contains secrets!
   ```

### Required Environment Variables for Security

```env
# Stripe Webhook Secret (CRITICAL for signature verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other required variables
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
CLIENT_URL=http://localhost:3000
```

### Webhook Setup Instructions

1. **Create Stripe Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

2. **Test Webhook Locally:**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   
   # Test webhook
   stripe trigger checkout.session.completed
   ```

## Support

For additional support or questions about the payment system:
1. Check the server logs for detailed error messages
2. Review the API documentation in the code comments
3. Test individual components using the admin tools
4. Verify all environment variables are properly configured
5. **Ensure webhook signature verification is working**
6. **Test payment flows in Stripe test mode before going live**

## Future Enhancements

Potential improvements to consider:
- Subscription-based payments
- Multiple currency support
- Payment plan options
- Advanced reporting and analytics
- Integration with accounting systems
- Mobile payment options
- Enhanced fraud detection
- Payment retry mechanisms
