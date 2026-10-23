# Admin Dashboard Navigation Guide

## 🎯 Overview

This guide shows you exactly where to find and manage all payment-related features in the admin dashboard, including the newly implemented admin fee payment approval system.

## 🏢 **Admin Dashboard Access**

### **Login & Navigation**:
1. **Login as Admin**: Use admin credentials at `/login`
2. **Admin Dashboard**: Navigate to `/admin/dashboard`
3. **Admin Sidebar**: Access all admin features from the left sidebar

---

## 💰 **Admin Fee Payment Approval**

### **📍 Location**: `/admin/payments` → **"Admin Fee Payments" Tab**

### **How to Access**:
1. **Login as Admin**
2. **Go to Admin Dashboard** (`/admin/dashboard`)
3. **Click "Payments & Accounting"** in the sidebar
4. **Click "Admin Fee Payments" tab** (second tab)

### **What You'll See**:
```
┌─────────────────────────────────────────────────────────────┐
│ Admin Payments & Accounting                                 │
├─────────────────────────────────────────────────────────────┤
│ [Course Payments] [Admin Fee Payments] ← Click this tab    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Admin Fee Payment Statistics                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │Pending  │ │Verified │ │Approved │ │ Total   │           │
│ │   3     │ │   1     │ │   5     │ │ $450.00 │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│ 📋 Payment Requests                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 John Doe - $9.00                                    │ │
│ │ 📅 2024-01-15 | 🏦 Bank Transfer                       │ │
│ │ 📎 Receipt: bank_receipt.pdf                           │ │
│ │ [View Receipt] [Verify] [Approve] [Reject]             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Available Actions**:
- ✅ **View Receipt**: Click to view uploaded receipt in modal
- ✅ **Verify**: Mark payment as verified (first step)
- ✅ **Approve**: Approve verified payment (updates balances)
- ❌ **Reject**: Reject payment with reason
- 👁️ **View Details**: See complete payment information

---

## 🔄 **Other Payment Management Areas**

### **1. 📚 Course Payments** (`/admin/payments` → "Course Payments" tab)
- **Purpose**: Manage course purchase payments
- **Features**: Approve direct transfers, view payment stats
- **Actions**: Approve/reject course payments

### **2. 💸 Instructor Payouts** (`/admin/payouts`)
- **Purpose**: Process instructor payout requests
- **Features**: Review payout requests, process payments
- **Actions**: Approve/reject/process payouts

### **3. 🔄 Refund Management** 
- **Location**: Integrated within relevant payment sections
- **Purpose**: Process student and instructor refunds
- **Features**: Review refund requests, process refunds

### **4. 📊 Payment Reports** (`/admin/payment-reports`)
- **Purpose**: View comprehensive payment analytics
- **Features**: Revenue reports, transaction history
- **Data**: All payment types and statistics

---

## 🎛️ **Admin Fee Payment Workflow**

### **Step 1: Instructor Submits Payment**
```
Instructor → /instructor/admin-fee-payment → Upload Receipt + Details → Submit
```

### **Step 2: Admin Receives Notification**
```
Admin Dashboard → Payments → Admin Fee Payments Tab → New Pending Payment
```

### **Step 3: Admin Reviews Payment**
```
Admin → View Receipt → Verify Payment Details → Click "Verify"
```

### **Step 4: Admin Approves Payment**
```
Admin → Add Admin Notes → Click "Approve" → Balance Updates Automatically
```

### **Step 5: System Updates**
```
✅ Instructor's owedAdminFees reduced
✅ Instructor's totalAdminFeesPaid increased  
✅ Instructor's availableBalance increased
✅ Transaction recorded in audit trail
✅ Payment status updated to "Approved"
```

---

## 🔍 **Quick Navigation Reference**

| Feature | URL Path | Tab/Section |
|---------|----------|-------------|
| **Admin Fee Payments** | `/admin/payments` | "Admin Fee Payments" tab |
| **Course Payments** | `/admin/payments` | "Course Payments" tab |
| **Instructor Payouts** | `/admin/payouts` | Main page |
| **Payment Reports** | `/admin/payment-reports` | Main page |
| **Billing Management** | `/admin/billing` | Main page |
| **User Management** | `/admin/users` | Main page |

---

## 📱 **Mobile & Responsive Design**

### **Mobile Access**:
- ✅ **Fully responsive** - Works on all devices
- ✅ **Touch-friendly** - Easy tap targets for mobile
- ✅ **Optimized layout** - Stacked cards on small screens
- ✅ **Receipt viewer** - Modal works on mobile devices

---

## 🔔 **Notifications & Alerts**

### **Admin Notifications**:
- 🔔 **New Payment Submitted**: Real-time notification when instructor submits
- ⏰ **Pending Payments**: Dashboard shows count of pending payments
- ✅ **Payment Approved**: Confirmation when payment is processed
- ❌ **Payment Rejected**: Notification with rejection reason

### **Dashboard Indicators**:
- 🟡 **Yellow Badge**: Pending payments requiring attention
- 🔵 **Blue Badge**: Verified payments ready for approval
- 🟢 **Green Badge**: Approved and processed payments
- 🔴 **Red Badge**: Rejected payments

---

## 🛠️ **Admin Actions & Permissions**

### **Required Permissions**:
- ✅ **Admin Role**: Must be logged in as admin
- ✅ **Payment Management**: Access to payment approval features
- ✅ **Financial Operations**: Ability to modify account balances

### **Available Actions**:
```javascript
// Admin can perform these actions:
- viewPaymentDetails()     // View complete payment information
- viewReceipt()           // Open receipt in modal viewer
- verifyPayment()         // Mark payment as verified
- approvePayment()        // Approve and process payment
- rejectPayment()         // Reject with reason
- addAdminNotes()         // Add internal notes
- downloadReceipt()       // Download receipt file
- viewTransactionHistory() // See related transactions
```

---

## 🎯 **Summary**

### **🔍 To Find Admin Fee Payments**:
1. **Login as Admin**
2. **Go to**: `/admin/payments`
3. **Click**: "Admin Fee Payments" tab
4. **See**: All pending instructor admin fee payments
5. **Actions**: View, verify, approve, or reject payments

### **✅ Key Features**:
- **Real-time Updates**: Payments appear immediately when submitted
- **Receipt Viewing**: Click to view uploaded receipts
- **Two-Step Approval**: Verify → Approve workflow
- **Balance Integration**: Automatic balance updates on approval
- **Audit Trail**: Complete transaction history
- **Mobile Friendly**: Works on all devices

### **🎉 Ready to Use**:
The admin fee payment approval system is now fully integrated into the admin dashboard and ready for production use!

---

## 📞 **Support & Troubleshooting**

### **Common Issues**:
- **Can't see payments**: Check admin permissions and refresh page
- **Receipt won't load**: Check S3 configuration and signed URLs
- **Balance not updating**: Verify payment approval completed successfully
- **Mobile issues**: Clear browser cache and reload

### **Debug Information**:
- **API Endpoints**: Check browser network tab for API calls
- **Console Logs**: Look for error messages in browser console
- **Database**: Verify records in AdminFeePayment collection
- **S3 Storage**: Confirm receipt files uploaded successfully
