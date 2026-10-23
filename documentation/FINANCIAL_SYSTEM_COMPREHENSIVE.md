# Mentora Financial System - Comprehensive Documentation

## 📊 System Overview

Mentora's financial system uses a **SPECIALIZED BILLING ARCHITECTURE** with role-specific accounts to ensure accurate financial tracking and prevent double-counting. This system was completely redesigned to fix critical accounting issues and provide reliable financial operations.

## 🚨 RECENT MAJOR UPDATES (2025)

### ✅ **FIXED CRITICAL ISSUES:**
1. **Unified Cash Direction (All Methods)** - Student pays Admin for all course payments (Stripe, PayPal, Direct Transfer)
2. **Single Finalizer** - All methods finalize via `Payment.completePayment()` for atomic accounting and audit trail
3. **Instructor Payouts Only** - Admin pays Instructor commissions; no per-sale liabilities for Instructors
4. **Standardized Commission Formulas** - Admin fee = fixed + percentage; Instructor commission = remainder
5. **Added Reconciliation Tools** - Automated financial accuracy verification

### 🔒 **ENHANCED SECURITY & DATA PROTECTION:**
6. **Financial Data Independence** - Billing accounts protected from bulk deletion
7. **Audit Trail Protection** - Transaction history cannot be bulk deleted
8. **Balance Integrity Safeguards** - Account balances protected from manipulation
9. **Enhanced Authentication** - Dual token support (headers + cookies)
10. **Bulk Deletion Controls** - Secure admin tools for non-financial data cleanup

## 🏗️ Architecture Components

### Core Models (SPECIALIZED SYSTEM)
- **InstructorBillingAccount**: Manages instructor earnings, commissions, and payout requests
- **StudentBillingAccount**: Handles student course purchases and annual fees ONLY
- **AdminBillingAccount**: Tracks platform revenue, expenses, and profit margins
- **BillingTransaction**: Immutable audit trail for all financial operations
- **Payment**: Records all payment attempts and completions (authoritative finalizer)

### Key Controllers
- **billingController.js**: Specialized accounts, admin payouts, admin account data
- **paymentController.js**: Initiation, gateway confirmations, direct transfer approvals; calls `Payment.completePayment()`
- (Webhooks optional): Gateway webhooks for robustness

## 💰 Financial Flow Architecture

### Revenue Streams
1. **Course Sales**: Student course purchases (cash received by Admin)
2. **Admin Fees**: Platform commission = fixed + percentage of course price
3. **Annual Fees**: Subscription fees (separate flow)

### Account Types
- **Student Accounts**: Credit-based system for course purchases
- **Instructor Accounts**: Commission tracking with payout management
- **Admin Accounts**: Platform revenue and expense tracking

## 📈 Key Financial Equations

### Course Payment Calculation
```
Total Course Price = Base Price
Admin Profit = Fixed Fee ($2) + (Course Price × Percentage Rate)
Instructor Commission = Course Price - Admin Profit

Default Values:
- Fixed Admin Fee: $2
- Admin Percentage: 10%
- Instructor Commission Rate: 90%
```

### Balance Calculations (FIXED FORMULAS)

#### Instructor Available Balance (NO MORE DOUBLE COUNTING)
```
availableBalance = welcomeCredits + totalCommissionEarned + adminCreditsAdded + totalGiftAmount
                 - totalPayoutsReceived - pendingPayouts - totalApprovedPayouts - annualFees

Note: owedAdminFees are liabilities, NOT deducted from available balance
Note: pendingPayouts are amounts requested but not approved yet
Note: totalApprovedPayouts are amounts approved but not paid yet
```

#### Admin Platform Balance
```
platformBalance = totalRevenue - totalInstructorPayouts - totalStudentRefunds - totalExpenses
profitMargin = (platformBalance / totalRevenue) × 100
```

#### Student Account Balance (FIXED - NO ADMIN FEES)
```
currentBalance = availableCredits + totalGiftAmount + adminCreditsAdded - annualFees

Note: Students NEVER owe admin fees on course purchases
Note: Students only pay annual subscription fees
```

## 🔍 **FINANCIAL RECONCILIATION SYSTEM**

### **WHY USE THE RECONCILIATION ENDPOINT?**

The reconciliation endpoint `/api/billing/admin/reconciliation` is **CRITICAL** for your financial system because:

### **🚨 WHAT IT DOES:**
1. **Verifies Financial Accuracy** - Checks if all money adds up correctly
2. **Detects Double-Counting** - Finds if transactions were recorded twice
3. **Identifies Missing Transactions** - Spots if payments weren't properly recorded
4. **Validates Balance Calculations** - Ensures all account balances are correct

### **📊 WHAT IT REPORTS:**
```javascript
{
  "totalStudentPurchases": 1500.00,    // All money students paid
  "totalInstructorEarnings": 1350.00,  // All instructor commissions
  "totalAdminRevenue": 150.00,         // All admin fees collected
  "totalInstructorPayouts": 500.00,    // Money paid to instructors
  "expectedAdminRevenue": 150.00,      // Should match totalAdminRevenue
  "revenueMatch": true,                // Are the numbers correct?
  "platformBalance": -350.00           // Admin revenue - instructor payouts
}
```

### **🎯 WHY YOU NEED IT:**
After fixing all the financial issues, you should **verify the fixes worked**:

1. **Test Before**: Run reconciliation to see current state
2. **Make Transactions**: Create some course purchases, instructor payouts
3. **Test After**: Run reconciliation again to verify accuracy

### **🔧 HOW TO TEST IT:**

**As Admin, call:**
```bash
GET /api/billing/admin/reconciliation
```

**Expected Results After Our Fixes:**
- ✅ `revenueMatch: true` (no more double-counting)
- ✅ Positive `platformBalance` (admin keeps fees)
- ✅ `totalStudentPurchases = totalInstructorEarnings + totalAdminRevenue`

**If you see issues:**
- ❌ `revenueMatch: false` = Still have accounting bugs
- ❌ Negative unexpected balances = Money is missing somewhere
- ❌ Numbers don't add up = Need to investigate further

### **🎉 SUCCESS INDICATORS:**
When reconciliation shows:
- All numbers add up correctly
- No negative unexpected balances  
- Revenue matches expected calculations
- Platform is profitable (positive balance)

**Then your financial system is working perfectly!**

## 🔄 Complete Payment Flow Scenarios

### 1. Credit Card Course Purchase Flow
```
Student Payment ($100)
        ↓
   Stripe Gateway
        ↓
Platform Receives $100
        ↓
   Revenue Split:
   ├── Admin: $12 (10% + $2)
   └── Instructor: $88 (commission)
        ↓
   Account Updates:
   ├── Student: Course access granted
   ├── Instructor: +$88 pending payout
   └── Admin: +$12 revenue
        ↓
   Transaction Recording:
   ├── Student: Course purchase debit
   ├── Instructor: Commission credit
   └── Admin: Revenue credit
```

### 2. Direct Transfer Course Purchase Flow (Unified)
```
Student Bank Transfer ($100)
        ↓
   Admin Bank Account (Admin details shown to student)
        ↓
Admin Receives $100
        ↓
   Revenue Split:
   ├── Admin: $12 (10% + $2)
   └── Instructor: $88 (pending payout)
        ↓
   Account Updates:
   ├── Student: Course access granted
   ├── Instructor: +$88 pending payout
   └── Admin: +$12 revenue (and cash $100)
        ↓
   Transaction Recording:
   ├── Student: Course purchase debit → Admin
   ├── Admin: Course payment credit (+$100)
   └── Instructor: Pending payout credit (+$88, status: pending)
```

### 3. Instructor Payout Request Flow
```
Instructor Payout Request ($500)
        ↓
   Balance Validation
        ↓
Available Balance: $500 ✓
        ↓
   Admin Approval
        ↓
   Bank Transfer Processing
        ↓
   Account Updates:
   ├── Instructor: -$500 balance
   └── Admin: -$500 platform balance
        ↓
   Transaction Recording:
   ├── Instructor: Payout debit
   └── Admin: Expense debit
```

## 🔐 Security Framework

### Payment Security
- **PCI DSS Compliance**: Through Stripe integration
- **Receipt Verification**: All fee payments require bank transfer receipts
- **External Payment Validation**: No internal balance manipulation allowed
- **Admin Approval Workflow**: Manual verification for sensitive transactions

### Data Protection
- **Encrypted Storage**: All financial data encrypted at rest
- **Audit Logging**: Complete transaction history with immutable records
- **Access Control**: Role-based permissions for financial operations
- **Input Sanitization**: All payment data validated and sanitized

## 📊 Transaction Categories & Types

### Transaction Categories
```javascript
const transactionCategories = {
  // Course-related
  course_purchase: 'Student course payment',
  commission: 'Instructor course commission',
  admin_fee_received: 'Admin fee collection',

  // Payout-related
  instructor_payout: 'Admin -> Instructor payout',

  // Fee-related
  annual_fee: 'Annual subscription fee',
  // admin_fee_payment: 'DEPRECATED (legacy)',

  // Credit-related
  credit_addition: 'Account credit addition',
  credit_payment: 'Payment using account credits',

  // Refund-related
  refund: 'Course refund',
  refund_expense: 'Admin refund expense'
};
```

## 🔄 Account State Transitions

### Instructor Account States
```
New Account (Free) → Welcome Credits Added → Course Sales → Commission Earned
                                                    ↓
                                            Payout Requests → Balance Reduced
                                                    ↓
                                            Admin Fees Owed → Fee Payments → Fees Cleared
```

### Student Account States
```
New Account → Course Purchases → Credits Used → Course Access Granted
                    ↓
            Annual Fees → Fee Payments → Account Active
```

### Admin Account States
```
Platform Launch → Revenue Collection → Instructor Payouts → Expense Tracking
                        ↓
                Fee Collections → Platform Profit → Financial Reporting
```

## 📊 Data Consistency Rules

### Balance Integrity Rules
1. **Total System Balance**: Sum of all account balances must equal zero
2. **Transaction Pairs**: Every debit must have a corresponding credit
3. **Immutable Records**: Transaction records cannot be modified after creation
4. **Audit Trail**: Every balance change must have a transaction record

### Validation Rules
```javascript
// Course Payment Validation
const validateCoursePayment = (payment) => {
  const adminFee = 2 + (payment.amount * 0.10);
  const instructorAmount = payment.amount - adminFee;
  
  // Ensure amounts are positive
  if (adminFee <= 0 || instructorAmount <= 0) {
    throw new Error('Invalid payment amounts');
  }
  
  // Ensure total equals original amount
  if (adminFee + instructorAmount !== payment.amount) {
    throw new Error('Payment split calculation error');
  }
  
  return { adminFee, instructorAmount };
};
```

## 🔍 Monitoring & Alerting

### Financial Monitoring Points
1. **Balance Discrepancies**: Alert when account balances don't match transaction history
2. **Large Transactions**: Flag transactions above threshold amounts
3. **Failed Payments**: Monitor payment failure rates and patterns
4. **Unusual Activity**: Detect abnormal transaction patterns
5. **Receipt Verification**: Track receipt upload and verification rates

## 📈 Reporting & Analytics

### Financial Reports
- **Revenue Analytics**: Platform revenue tracking and trends
- **Commission Reports**: Instructor earnings and payout history
- **Fee Collection**: Admin fee collection and outstanding amounts
- **Payment Methods**: Analysis of payment method usage

### Audit Reports
- **Transaction History**: Complete audit trail for all operations
- **Balance Reconciliation**: Account balance verification reports
- **Fee Payment Tracking**: Admin fee payment status and history
- **Payout Management**: Instructor payout request and processing reports

## 🚀 API Endpoints Summary

### Payment Endpoints
```
POST   /api/payments/initiate                    # Initiate payment for a course
POST   /api/payments/stripe/confirm              # Confirm Stripe payment
POST   /api/payments/direct-transfer             # Submit direct transfer with receipt
POST   /api/payments/:id/approve                 # Admin approve/reject direct transfer
```

### Billing Endpoints (Role-based)
```
GET    /api/specialized-billing/account          # Get role-based billing account
GET    /api/specialized-billing/summary          # Comprehensive billing summary
GET    /api/specialized-billing/transactions     # Transaction history (filtered by role)
```

### Admin Endpoints (Financial)
```
GET    /api/specialized-billing/admin/account              # Admin account & earnings
POST   /api/specialized-billing/admin/payout/:instructorId # Payout instructor commissions
GET    /api/specialized-billing/admin/reconciliation       # Financial reconciliation report
```

## 🔧 Technical Implementation

### Database Schema
- **Normalized Design**: Proper database normalization for financial data
- **Referential Integrity**: Foreign key constraints for data consistency
- **Indexing**: Optimized indexes for financial queries
- **Backup Strategy**: Regular backups with point-in-time recovery

### API Design
- **RESTful Architecture**: Standard REST API design patterns
- **Rate Limiting**: Protection against payment API abuse
- **Input Validation**: Comprehensive validation for all financial inputs
- **Error Handling**: Proper error responses for payment failures

### Integration Points
- **Stripe API**: Credit card and payment processing
- **Bank Transfer System**: Direct transfer verification
- **Email Notifications**: Payment confirmations and receipts
- **File Storage**: Receipt and document management

## 📝 Compliance & Regulations

### Financial Compliance
- **PCI DSS**: Payment card industry compliance through Stripe
- **GDPR**: Data protection compliance for financial information
- **SOX**: Financial reporting accuracy and controls
- **Anti-Money Laundering**: Transaction monitoring and reporting

### Audit Requirements
- **Immutable Records**: All financial transactions permanently recorded
- **Audit Trail**: Complete history of all financial operations
- **Documentation**: Comprehensive documentation of all processes
- **Regular Reviews**: Periodic financial system audits

## 🛡️ Financial Data Protection & Independence

### Overview
The Mentora financial system implements comprehensive data protection measures to ensure financial integrity, regulatory compliance, and user trust. Financial data is completely independent from general system operations and protected from accidental or malicious deletion.

### Protected Financial Models

#### Core Financial Accounts (CANNOT BE DELETED)
```javascript
const protectedFinancialModels = [
  'InstructorBillingAccount', // Instructor earnings and commission tracking
  'StudentBillingAccount',    // Student credits and course purchase history
  'AdminBillingAccount',      // Platform revenue and expense tracking
  'User',                     // User profiles linked to financial accounts
  'Course',                   // Course content tied to financial transactions
  'Lesson'                    // Educational content with financial implications
];
```

#### Financial Transaction History (PROTECTED)
```javascript
const protectedTransactionModels = [
  'BillingTransaction',       // Immutable financial audit trail
  'Payment',                  // All payment records and attempts
  'Payout',                   // Instructor payout history
  'Enrollment'                // Course enrollments with financial implications
];
```

### Data Independence Architecture

#### Separation of Concerns
1. **Financial Data**: Completely isolated from general application data
2. **Educational Content**: Protected due to financial relationships
3. **User Accounts**: Protected as they anchor all financial relationships
4. **Audit Trails**: Immutable records for compliance and legal requirements

#### Why Financial Data Must Remain Independent

##### Legal & Compliance Requirements
- **Tax Documentation**: Financial records required for tax reporting
- **Audit Compliance**: Regulatory audits require complete transaction history
- **Legal Protection**: Financial records provide legal protection in disputes
- **Anti-Money Laundering**: Transaction monitoring requires complete history

##### Business Continuity
- **Balance Integrity**: Account balances depend on complete transaction history
- **Revenue Tracking**: Platform revenue calculations require all payment data
- **Commission Accuracy**: Instructor payouts depend on complete sales history
- **Refund Processing**: Refunds require original transaction references

##### User Trust & Security
- **Account Security**: Users expect their financial data to be permanent
- **Transaction History**: Users need access to complete payment history
- **Balance Verification**: Users must be able to verify account balances
- **Dispute Resolution**: Complete records needed for payment disputes

### Bulk Deletion System Integration

#### Safe vs. Protected Data Classification

##### Safe to Delete (Green Zone)
```javascript
const safeToDelete = [
  'Comment',           // User comments and discussions
  'Test',              // Educational assessments
  'Grade',             // Test results and scores
  'Notification',      // System notifications
  'Message',           // User messages
  'LiveSession',       // Completed live sessions
  'Certificate',       // Achievement certificates
  'EnrollmentRequest'  // Processed enrollment requests
];
```

##### Sensitive but Deletable (Orange Zone)
```javascript
const sensitiveButDeletable = [
  'Payment',              // Payment history (with strong confirmation)
  'BillingTransaction',   // Transaction history (with strong confirmation)
  'GiftCard',            // Gift card records (with strong confirmation)
  'AdminFeePayment'      // Admin fee payment records (with strong confirmation)
];
```

##### Protected Financial Data (Red Zone)
```javascript
const protectedFinancialData = [
  'InstructorBillingAccount', // NEVER deletable
  'StudentBillingAccount',    // NEVER deletable
  'AdminBillingAccount',      // NEVER deletable
  'User',                     // NEVER deletable (financial anchor)
  'Course',                   // NEVER deletable (revenue source)
  'Enrollment'                // NEVER deletable (financial relationship)
];
```

### Security Implementation

#### Authentication & Authorization
```javascript
// Enhanced authentication for financial operations
const financialProtection = {
  authentication: {
    dualTokenSupport: true,        // Headers + cookies
    cookieAuthentication: true,    // HTTP-only secure cookies
    tokenRefresh: 'automatic',     // Seamless token renewal
    sessionTimeout: '24 hours'     // Extended for financial operations
  },
  authorization: {
    adminOnly: true,               // Only admins can access bulk deletion
    confirmationRequired: true,    // Specific confirmation text required
    rateLimiting: true,           // Strict rate limits on deletions
    auditLogging: true            // Complete audit trail
  }
};
```

#### Bulk Deletion Safeguards
```javascript
// Financial data protection in bulk deletion system
const bulkDeletionSafeguards = {
  protectedModels: {
    check: 'automatic',           // Automatic protection check
    override: 'impossible',       // Cannot be overridden
    logging: 'comprehensive'      // All attempts logged
  },
  confirmationSystem: {
    textRequired: true,           // Specific confirmation text
    casesSensitive: true,         // Exact match required
    timeout: '5 minutes',         // Confirmation expires
    attempts: 'limited'           // Limited confirmation attempts
  },
  rateLimiting: {
    standard: '10 per 15 minutes', // Standard deletion operations
    nuclear: '1 per hour',         // Nuclear option severely limited
    financial: 'never'             // Financial data never deletable
  }
};
```

### Monitoring & Alerting

#### Financial Data Access Monitoring
```javascript
// Comprehensive monitoring for financial data access
const financialMonitoring = {
  accessLogging: {
    allAttempts: true,            // Log all access attempts
    failedAttempts: true,         // Special attention to failures
    bulkOperations: true,         // Monitor bulk operations
    adminActions: true            // Track all admin actions
  },
  alerting: {
    unauthorizedAccess: 'immediate',  // Immediate alerts
    bulkDeletionAttempts: 'immediate', // Alert on deletion attempts
    financialDataAccess: 'logged',    // Log all financial access
    suspiciousPatterns: 'flagged'     // Pattern recognition
  }
};
```

#### Audit Trail Requirements
```javascript
// Comprehensive audit trail for financial operations
const auditTrail = {
  required: [
    'user_id',              // Who performed the action
    'action_type',          // What action was performed
    'timestamp',            // When the action occurred
    'ip_address',           // Where the action came from
    'user_agent',           // What client was used
    'before_state',         // State before the action
    'after_state',          // State after the action
    'success_status',       // Whether the action succeeded
    'error_details'         // Any errors that occurred
  ],
  retention: 'permanent',   // Audit logs never deleted
  encryption: true,         // Audit logs encrypted at rest
  backup: 'multiple'        // Multiple backup copies
};
```

### Best Practices for Financial Data Management

#### Development Guidelines
1. **Never Mock Financial Data**: Use separate test databases
2. **Validate All Calculations**: Double-check all financial math
3. **Test Edge Cases**: Test boundary conditions thoroughly
4. **Audit All Changes**: Log every financial data modification
5. **Backup Before Changes**: Always backup before financial updates

#### Production Operations
1. **Regular Backups**: Automated daily backups with verification
2. **Monitoring Dashboards**: Real-time financial data monitoring
3. **Reconciliation Reports**: Daily financial reconciliation
4. **Access Controls**: Strict access controls for financial data
5. **Incident Response**: Rapid response for financial data issues

#### Compliance Maintenance
1. **Regular Audits**: Quarterly financial system audits
2. **Documentation Updates**: Keep documentation current
3. **Security Reviews**: Annual security assessments
4. **Compliance Training**: Regular staff training on financial compliance
5. **Vendor Management**: Ensure third-party compliance (Stripe, etc.)

---

*This comprehensive documentation covers all aspects of the Mentora financial system, including the new bulk deletion protections and financial data independence measures implemented in 2025.*
