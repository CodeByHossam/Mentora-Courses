# 📚 Mentora API Documentation

[![API Version](https://img.shields.io/badge/API-v1.0-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)]()
[![Express](https://img.shields.io/badge/Express-4.18.x-lightgrey.svg)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x-green.svg)]()

## 🌟 Overview

Mentora provides a comprehensive RESTful API for building modern learning management systems. The API supports multi-role authentication, course management, interactive learning features, and analytics. Built with Node.js, Express, and MongoDB, it offers robust security, scalability, and performance.

### 🔑 Key Features
- **JWT-based Authentication** with refresh tokens
- **Role-based Access Control** (Admin, Instructor, Student)
- **File Upload Support** for multimedia content
- **Real-time Interactions** through comments and discussions
- **Comprehensive Analytics** and reporting
- **Input Validation** and sanitization
- **Rate Limiting** and security headers

## 🌐 Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| **Development** | `http://localhost:5000/api` | Local development server |
| **Staging** | `https://staging-api.mentora.com/api` | Testing environment |
| **Production** | `https://api.mentora.com/api` | Live production API |

## 📋 API Standards

- **Protocol**: HTTPS (HTTP in development)
- **Format**: JSON for all requests/responses
- **Authentication**: JWT Bearer tokens + HTTP-only cookies
- **Rate Limiting**: Advanced user-based rate limiting
  - **General Read**: 1000 requests per 15 minutes
  - **API Read**: 300 requests per 5 minutes
  - **Course Creation**: 50 requests per hour
  - **Course Updates**: 100 requests per 15 minutes
  - **Course Enrollment**: 20 requests per 15 minutes
  - **Lesson Creation**: 100 requests per 30 minutes
  - **Payments**: 10 requests per 15 minutes
  - **File Uploads**: 50 requests per hour
  - **Video Uploads**: 10 requests per hour
  - **Messaging**: 30 requests per 15 minutes
  - **Admin Operations**: 500 requests per 15 minutes
  - **Login Attempts**: 5 per 15 minutes (security)
  - **Registration**: 3 per hour
- **CORS**: Enabled for frontend domains with credentials support
- **Versioning**: URL-based versioning (`/api/v1/`)

---

## API Resources & Main Endpoints (Detailed)

Below is a detailed table of the main API resources, their endpoints, HTTP methods, access level, and request body (if applicable).

### Auth

| Route          | Method | Description              | Access | Request Body Example                                                                     |
| -------------- | ------ | ------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| /auth/register | POST   | Register new user        | All    | `{ "name": "John", "email": "john@example.com", "password": "pass", "role": "student" }` |
| /auth/login    | POST   | Login                    | All    | `{ "email": "john@example.com", "password": "pass" }`                                    |
| /auth/logout   | POST   | Logout                   | All    | -                                                                                        |
| /auth/refresh  | POST   | Refresh JWT token        | All    | -                                                                                        |
| /auth/me       | GET    | Get current user profile | All    | -                                                                                        |

### Users

| Route                                    | Method | Description                 | Access            | Request Body Example                                                                        |
| ---------------------------------------- | ------ | --------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| /users                                   | GET    | Get all users               | Admin             | -                                                                                           |
| /users                                   | POST   | Create user                 | Admin             | `{ "name": "Jane", "email": "jane@example.com", "password": "pass", "role": "instructor" }` |
| /users/:id                               | GET    | Get user by ID              | Admin             | -                                                                                           |
| /users/:id                               | PUT    | Update user                 | Admin             | `{ "name": "Jane Updated", "role": "admin", "status": "active" }`                           |
| /users/:id                               | DELETE | Delete user                 | Admin             | -                                                                                           |
| /users/instructor/:instructorId/students | GET    | Get students for instructor | Admin, Instructor | -                                                                                           |

### Courses

| Route                             | Method | Description                    | Access            | Request Body Example                                                                                                                                                                                        |
| --------------------------------- | ------ | ------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /courses                          | GET    | Get all courses                | All               | -                                                                                                                                                                                                           |
| /courses                          | POST   | Create course                  | Admin, Instructor | `{ "title": "Course Title", "description": "Desc", "category": "cat_id", "price": 99.99, "sections": [{ "title": "Section", "lessons": [{ "title": "Lesson", "duration": "30 min", "type": "video" }] }] }` |
| /courses/:id                      | GET    | Get single course              | All               | -                                                                                                                                                                                                           |
| /courses/:id                      | PUT    | Update course                  | Admin, Instructor | `{ "title": "Updated Title", "description": "Updated Desc", "price": 149.99 }`                                                                                                                              |
| /courses/:id                      | DELETE | Delete course                  | Admin, Instructor | -                                                                                                                                                                                                           |
| /courses/:id/enroll               | POST   | Enroll in course               | Student           | -                                                                                                                                                                                                           |
| /courses/instructor/:instructorId | GET    | Get instructor's courses       | Admin, Instructor | -                                                                                                                                                                                                           |
| /courses/user/enrolled            | GET    | Get enrolled courses (student) | Student, Admin    | -                                                                                                                                                                                                           |
| /courses/stats                    | GET    | Get course stats               | All               | -                                                                                                                                                                                                           |

### Categories

| Route           | Method | Description        | Access | Request Body Example                                        |
| --------------- | ------ | ------------------ | ------ | ----------------------------------------------------------- |
| /categories     | GET    | Get all categories | All    | -                                                           |
| /categories     | POST   | Create category    | Admin  | `{ "name": "Category Name", "description": "Desc" }`        |
| /categories/:id | GET    | Get category by ID | All    | -                                                           |
| /categories/:id | PUT    | Update category    | Admin  | `{ "name": "Updated Name", "description": "Updated Desc" }` |
| /categories/:id | DELETE | Delete category    | Admin  | -                                                           |

### Lessons

| Route               | Method | Description              | Access            | Request Body Example                                    |
| ------------------- | ------ | ------------------------ | ----------------- | ------------------------------------------------------- |
| /lessons            | GET    | Get all lessons          | All               | -                                                       |
| /lessons/:courseId  | POST   | Add lesson (file upload) | Admin, Instructor | `multipart/form-data: { title, content, image, video }` |
| /lessons/course/:id | GET    | Get lessons for course   | Admin, Instructor | -                                                       |
| /lessons/:id        | GET    | Get lesson by ID         | Admin, Instructor | -                                                       |
| /lessons/:id        | PUT    | Update lesson            | Admin, Instructor | `{ "title": "Updated", "content": "..." }`              |
| /lessons/:id        | DELETE | Delete lesson            | Admin, Instructor | -                                                       |

### Course Interactions

| Route                                                                        | Method | Description             | Access        | Request Body Example                  |
| ---------------------------------------------------------------------------- | ------ | ----------------------- | ------------- | ------------------------------------- |
| /course-interactions/:courseId                                               | GET    | Get course interactions | Authenticated | -                                     |
| /course-interactions/:courseId/comments                                      | POST   | Add comment             | Authenticated | `{ "text": "Nice course!" }`          |
| /course-interactions/:courseId/comments/:commentId                           | PUT    | Edit comment            | Authenticated | `{ "text": "Updated comment" }`       |
| /course-interactions/:courseId/comments/:commentId                           | DELETE | Delete comment          | Authenticated | -                                     |
| /course-interactions/:courseId/tests                                         | POST   | Add test (file upload)  | Instructor    | `multipart/form-data: { testFile }`   |
| /course-interactions/:courseId/tests/:testId/submit                          | POST   | Submit test answer      | Student       | `multipart/form-data: { answerFile }` |
| /course-interactions/:courseId/tests/:testId/submissions/:submissionId/grade | PUT    | Grade test submission   | Instructor    | `{ "grade": 95 }`                     |
| /course-interactions/:courseId/attachments                                   | POST   | Add attachment (file)   | Authenticated | `multipart/form-data: { file }`       |
| /course-interactions/:courseId/attachments/:attachmentId                     | DELETE | Remove attachment       | Authenticated | -                                     |

### Enrollment Requests

| Route                     | Method | Description                    | Access  | Request Body Example          |
| ------------------------- | ------ | ------------------------------ | ------- | ----------------------------- |
| /enrollment-requests      | POST   | Create enrollment request      | Student | `{ "courseId": "course_id" }` |
| /enrollment-requests      | GET    | Get all enrollment requests    | Admin   | -                             |
| /enrollment-requests/user | GET    | Get user's enrollment requests | Student | -                             |
| /enrollment-requests/:id  | PATCH  | Update enrollment request      | Admin   | `{ "status": "approved" }`    |

### Payments

| Route                 | Method | Description          | Access  | Request Body Example                     |
| --------------------- | ------ | -------------------- | ------- | ---------------------------------------- |
| /payments/initiate | POST | Initiate payment | Student | `{ "courseId": "course_id", "amount": 99.99, "method": "stripe" }` |
| /payments/stripe/confirm | POST | Confirm Stripe payment | Student | `{ "paymentId": "payment_id", "sessionId": "stripe_session_id" }` |
| /payments/paypal/confirm | POST | Confirm PayPal payment | Student | `{ "paymentId": "payment_id", "orderId": "paypal_order_id" }` |
| /payments/direct-transfer | POST | Submit direct transfer | Student | `multipart/form-data: { courseId, amount, receipt }` |
| /payments/:id/approve | POST | Approve direct transfer | Admin | `{ "status": "approved" }` |
| /payments/my-payments | GET | Get user payments | Student | - |
| /payments/stats | GET | Get payment stats | Admin | - |
| /payments/reports | GET | Get payment reports | Admin | - |

### Levels

| Route        | Method | Description      | Access | Request Body Example                     |
| ------------ | ------ | ---------------- | ------ | ---------------------------------------- |
| /levels      | GET    | Get all levels   | All    | -                                        |
| /levels      | POST   | Create level     | Admin  | `{ "name": "Advanced", "order": 3 }`     |
| /levels/:id  | PUT    | Update level     | Admin  | `{ "name": "Expert", "order": 4 }`       |
| /levels/:id  | DELETE | Delete level     | Admin  | -                                        |

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Register

```
POST /auth/register
```

### Login

```
POST /auth/login
```

### Refresh Token

```
POST /auth/refresh
```

### Logout

```
POST /auth/logout
```

### Get Current User

```
GET /auth/me
```

---

## Role-Based Access

- **Admin:** Full access to all resources (users, courses, categories, analytics, payments, enrollment requests)
- **Instructor:** Manage own courses and lessons, view analytics, manage course content, view students
- **Student:** Browse/enroll in courses, track progress, submit enrollment requests, view/update profile

---

## Example: Course Endpoints

### Get All Courses

```
GET /courses
```

### Get Single Course

```
GET /courses/:id
```

### Create Course (Admin/Instructor)

```
POST /courses
```

### Update Course (Admin/Instructor)

```
PUT /courses/:id
```

### Delete Course (Admin/Instructor)

```
DELETE /courses/:id
```

### Enroll in Course (Student)

```
POST /courses/:id/enroll
```

---

## Example: User Endpoints

### Get All Users (Admin)

```
GET /users
```

### Create User (Admin)

```
POST /users
```

### Get Students for Instructor

```
GET /users/instructor/:instructorId/students
```

---

## Example: Category Endpoints (Admin)

### Get All Categories

```
GET /categories
```

### Create Category

```
POST /categories
```

### Update Category

```
PUT /categories/:id
```

### Delete Category

```
DELETE /categories/:id
```

---

## Example: Lesson Endpoints (Admin/Instructor)

### Get All Lessons

```
GET /lessons
```

### Add Lesson (with file upload)

```
POST /lessons/:courseId
```

### Update Lesson

```
PUT /lessons/:id
```

### Delete Lesson

```
DELETE /lessons/:id
```

---

## Example: Course Interaction Endpoints

### Add Comment

```
POST /course-interactions/:courseId/comments
```

### Edit Comment

```
PUT /course-interactions/:courseId/comments/:commentId
```

### Delete Comment

```
DELETE /course-interactions/:courseId/comments/:commentId
```

### Add Test

```
POST /course-interactions/:courseId/tests
```

### Submit Test Answer

```
POST /course-interactions/:courseId/tests/:testId/submit
```

### Grade Test Submission

```
PUT /course-interactions/:courseId/tests/:testId/submissions/:submissionId/grade
```

### Add Attachment

```
POST /course-interactions/:courseId/attachments
```

### Remove Attachment

```
DELETE /course-interactions/:courseId/attachments/:attachmentId
```

---

## Example: Enrollment Request Endpoints

### Create Enrollment Request (Student)

```
POST /enrollment-requests
```

### Get All Enrollment Requests (Admin)

```
GET /enrollment-requests
```

### Get User's Enrollment Requests (Student)

```
GET /enrollment-requests/user
```

### Update Enrollment Request (Admin)

```
PATCH /enrollment-requests/:id
```

---

## Example: Payment Endpoints

### Create Payment (Admin)

```
POST /payments
```

### Get All Payments (Admin)

```
GET /payments
```

### Get Student Payments

```
GET /payments/student/:id
```

### Get Payment Stats (Admin)

```
GET /payments/stats
```

### Update Payment (Admin)

```
PUT /payments/:id
```

### Delete Payment (Admin)

```
DELETE /payments/:id
```

---

## 🗑️ Bulk Deletion API

### Overview
The Bulk Deletion API provides secure endpoints for administrators to manage large-scale data cleanup operations. All endpoints require admin authentication and specific confirmation text to prevent accidental deletions.

### Base Route
```
/admin/bulk-delete
```

### Authentication
- **Required Role**: Admin
- **Authentication**: JWT Bearer token or HTTP-only cookies
- **Rate Limiting**: Applied per operation type

### Endpoints

#### Get Deletion Statistics
```http
GET /admin/bulk-delete/statistics
```

**Description**: Retrieve counts of all deletable records organized by safety level.

**Response**:
```json
{
  "success": true,
  "data": {
    "safeModels": {
      "comments": 150,
      "tests": 45,
      "notifications": 200,
      "messages": 89,
      "liveSessions": 12,
      "certificates": 67,
      "enrollmentRequests": 23
    },
    "sensitiveModels": {
      "payments": 340,
      "billingTransactions": 156,
      "giftCards": 12,
      "adminFeePayments": 78
    },
    "protectedModels": {
      "users": 1250,
      "courses": 45,
      "instructorBillingAccounts": 23,
      "studentBillingAccounts": 1200,
      "adminBillingAccounts": 3
    },
    "relationshipModels": {
      "enrollments": 2340,
      "courseInteractions": 5670
    }
  }
}
```

#### Safe Deletion Operations

##### Delete All Comments
```http
DELETE /admin/bulk-delete/comments
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_COMMENTS"
}
```

##### Delete All Tests
```http
DELETE /admin/bulk-delete/tests
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_TESTS"
}
```

##### Delete All Notifications
```http
DELETE /admin/bulk-delete/notifications
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_NOTIFICATIONS"
}
```

##### Delete All Messages
```http
DELETE /admin/bulk-delete/messages
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_MESSAGES"
}
```

##### Delete Live Sessions
```http
DELETE /admin/bulk-delete/live-sessions
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_LIVE_SESSIONS",
  "includeActive": false
}
```

##### Delete All Certificates
```http
DELETE /admin/bulk-delete/certificates
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_CERTIFICATES"
}
```

##### Delete Enrollment Requests
```http
DELETE /admin/bulk-delete/enrollment-requests
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ENROLLMENT_REQUESTS",
  "includeActive": false
}
```

#### Sensitive Deletion Operations

##### Delete Payment History
```http
DELETE /admin/bulk-delete/payments
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_PAYMENTS_HISTORY"
}
```

##### Delete Billing Transactions
```http
DELETE /admin/bulk-delete/billing-transactions
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_BILLING_TRANSACTIONS"
}
```

##### Delete Gift Cards
```http
DELETE /admin/bulk-delete/gift-cards
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_GIFT_CARDS"
}
```

##### Delete Admin Fee Payments
```http
DELETE /admin/bulk-delete/admin-fee-payments
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_ADMIN_FEE_PAYMENTS"
}
```

#### Nuclear Option

##### Delete All Non-Critical Data
```http
DELETE /admin/bulk-delete/nuclear
```

**Request Body**:
```json
{
  "confirmPassword": "DELETE_ALL_NON_CRITICAL_DATA"
}
```

**Description**: Deletes ALL safe-to-delete data in one operation. Financial and user data is preserved.

**Rate Limit**: 1 request per hour

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Successfully deleted 150 comments",
  "deletedCount": 150
}
```

#### Error Responses

##### Invalid Confirmation
```json
{
  "success": false,
  "message": "Invalid confirmation password. Type 'DELETE_ALL_COMMENTS' to confirm."
}
```

##### Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Too many deletion requests. Please wait 15 minutes before trying again."
}
```

##### Unauthorized Access
```json
{
  "success": false,
  "message": "Access forbidden. Required role(s): admin. Your role: student"
}
```

### Security Features

#### Confirmation Text Requirements
Each deletion operation requires a specific confirmation text to prevent accidental deletions:

| Operation | Required Confirmation Text |
|-----------|---------------------------|
| Comments | `DELETE_ALL_COMMENTS` |
| Tests | `DELETE_ALL_TESTS` |
| Notifications | `DELETE_ALL_NOTIFICATIONS` |
| Messages | `DELETE_ALL_MESSAGES` |
| Live Sessions | `DELETE_LIVE_SESSIONS` |
| Certificates | `DELETE_ALL_CERTIFICATES` |
| Enrollment Requests | `DELETE_ENROLLMENT_REQUESTS` |
| Payments | `DELETE_ALL_PAYMENTS_HISTORY` |
| Billing Transactions | `DELETE_ALL_BILLING_TRANSACTIONS` |
| Gift Cards | `DELETE_ALL_GIFT_CARDS` |
| Admin Fee Payments | `DELETE_ALL_ADMIN_FEE_PAYMENTS` |
| Nuclear Option | `DELETE_ALL_NON_CRITICAL_DATA` |

#### Rate Limiting
- **Standard Deletions**: 10 operations per 15 minutes
- **Nuclear Deletion**: 1 operation per hour
- **Statistics Endpoint**: 200 requests per 15 minutes

#### Audit Logging
All deletion operations are logged with:
- Admin user details (name, email, role)
- Operation type and timestamp
- Number of records deleted
- IP address and user agent
- Request details

#### Protected Models
The following models CANNOT be deleted via bulk operations:
- User accounts and profiles
- Course and lesson content
- Billing accounts (Instructor/Student/Admin)
- Current account balances
- Active enrollments

---

## Error Responses

All endpoints may return the following error responses:

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found

See the detailed examples in the sections above for error response formats.

---

## 🔄 Specialized Billing System

### Admin Billing Account
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/specialized-billing/admin/account` | GET | Get admin billing account | Admin |
| `/specialized-billing/admin/transactions` | GET | Get all platform transactions | Admin |
| `/specialized-billing/admin/top-instructors` | GET | Get top earning instructors | Admin |
| `/specialized-billing/admin/process-instructor-payout` | POST | Process payout to instructor | Admin |

### Instructor Billing Account
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/specialized-billing/instructor/account` | GET | Get instructor billing account | Instructor |
| `/specialized-billing/instructor/transactions` | GET | Get instructor transactions | Instructor |
| `/specialized-billing/instructor/course-earnings` | GET | Get earnings by course | Instructor |

### Student Billing Account
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/specialized-billing/student/account` | GET | Get student billing account | Student |
| `/specialized-billing/student/transactions` | GET | Get student transactions | Student |
| `/specialized-billing/student/purchase-history` | GET | Get course purchase history | Student |

### Billing Features
- **Automatic Account Creation**: Billing accounts created on first transaction
- **Welcome Credits**: Instructors get 100 credits (paid) or 100,000 credits (free accounts)
- **Commission Tracking**: Real-time instructor commission calculations
- **Transaction History**: Complete audit trail for all financial operations
- **Gift Cards**: Support for gift card credits and redemption

---

## 📧 Live Session Reminders

### Automated Email Reminders
The system automatically sends email reminders for live sessions:

| Timing | Schedule | Recipients |
|--------|----------|------------|
| **24 hours before** | Daily at 9:00 AM | Students + Instructor |
| **1 hour before** | Every hour | Students + Instructor |
| **15 minutes before** | Every 15 minutes | Students + Instructor |
| **Starting now** | Every 5 minutes | Students + Instructor |

### Reminder Service
- **Location**: `server/services/reminderService.js`
- **Auto-start**: Enabled in `server.js`
- **Cron Jobs**: Uses node-cron for scheduling
- **Email Provider**: Nodemailer with SMTP/Gmail support

---

## 🛡️ Security Features

### Input Sanitization
- **XSS Prevention**: DOMPurify for HTML content
- **NoSQL Injection**: Express-mongo-sanitize
- **Validation**: Express-validator on all inputs

### Rate Limiting Strategy
- **User-based**: Tracks by user ID (authenticated) or IP (anonymous)
- **Operation-specific**: Different limits for different operations
- **Bypass**: Super admin can bypass certain limits

### File Upload Security
- **Type Validation**: Whitelist of allowed MIME types
- **Size Limits**: 5MB images, 100MB videos, 10MB documents
- **Virus Scanning**: Recommended for production
- **Storage**: Cloudinary (images/videos), S3 (documents)

---

## 🗑️ Data Cleanup on Deletion

### Automatic Media Cleanup
When deleting resources, associated media is automatically removed:

| Resource | Cleanup Actions |
|----------|-----------------|
| **Course** | Deletes course image, all lesson media, all attachments |
| **Lesson** | Deletes lesson image, video, PDF from Cloudinary |
| **User** | Deletes profile picture from Cloudinary |
| **Test** | Deletes test file from S3 |
| **Attachment** | Deletes file from S3 |
| **Certificate** | Deletes PDF from S3 |

### Storage Providers
- **Cloudinary**: Images, videos, lesson PDFs
- **AWS S3**: Test files, attachments, certificates, receipts

---

## Notes

- All endpoints return JSON.
- File uploads (for lessons, attachments, tests) use `multipart/form-data`.
- Pagination, filtering, and sorting are available on most list endpoints (see query parameters).
- For full request/response examples, see the detailed sections below (legacy documentation).

---

# [Legacy: Detailed Endpoint Documentation Below]

<!-- The rest of this file contains detailed request/response examples for each endpoint. Update as needed. -->
