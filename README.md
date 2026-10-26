# 🎓 Mentora - Enterprise Learning Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x-green.svg)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Integrated-blueviolet)](https://stripe.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Integrated-blue)](https://paypal.com/)

> **A production-ready, enterprise-grade Learning Management System with advanced payment processing, live video sessions, comprehensive billing, and automated financial tracking.**

Mentora is a full-stack online learning platform that combines modern educational technology with robust financial management. Built for scalability and reliability, it serves educational institutions, training organizations, and independent instructors who need a professional platform with complete payment automation and commission tracking.

---

## 🌟 **Platform Highlights**

### 💰 **Advanced Financial System**
- **Multi-Gateway Payments**: Stripe, PayPal, and Direct Bank Transfer support
- **Automated Commission Tracking**: Real-time instructor earnings calculation
- **Specialized Billing Accounts**: Role-specific accounts (Admin, Instructor, Student)
- **Gift Card System**: Flexible credit management and refund processing
- **Payout Management**: Automated instructor payout requests and approvals
- **Financial Reporting**: Comprehensive analytics and reconciliation tools

### 🎥 **Live Learning Features**
- **Zoom Integration**: Built-in video conferencing with Zoom Web SDK
- **Automated Reminders**: Email notifications (24h, 1h, 15min, start time)
- **Recording Management**: Upload and share session recordings
- **Real-time Participation**: Track attendees and engagement
- **Session Scheduling**: Calendar integration with timezone support

### 📊 **Enterprise-Grade Management**
- **Role-Based Access Control**: Admin, Instructor, Student with granular permissions
- **Comprehensive Analytics**: Revenue tracking, enrollment metrics, course performance
- **Bulk Operations**: Efficient data management with safety controls
- **Audit Trails**: Complete transaction and activity logging
- **Payment Reports**: Detailed financial analytics and export capabilities

## ✨ Key Features

### 🔐 Security & Authentication
- JWT-based secure authentication with refresh tokens
- Role-based access control (RBAC) with granular permissions
- Input sanitization and XSS protection
- Rate limiting and security headers
- Password encryption with bcrypt

### 👥 Multi-Role Architecture
- **Admin**: Complete platform management and analytics
- **Instructor**: Course creation, student management, and analytics
- **Student**: Course enrollment, progress tracking, and learning

### 📚 **Course Management**
- **Multimedia Content**: Video, image, PDF, and document uploads via Cloudinary & AWS S3
- **Structured Learning**: Organize content with sections and lessons
- **Interactive Testing**: Create tests with answer keys and automated grading
- **File Attachments**: Share resources and supplementary materials
- **Progress Tracking**: Monitor student completion and engagement
- **Certificates**: Automated certificate generation and email delivery

### 💳 **Payment Processing**
- **Multiple Payment Methods**: Stripe, PayPal, Direct Bank Transfer
- **Secure Transactions**: PCI-compliant payment processing
- **Automated Enrollment**: Instant course access after payment
- **Receipt Management**: Upload and track payment receipts
- **Refund System**: Gift card-based refund processing
- **Commission Automation**: Real-time instructor earnings calculation

### 💬 **Interactive Learning**
- **Live Video Sessions**: Integrated Zoom meetings with automated reminders
- **Discussion Forums**: Course-specific comments and Q&A
- **Direct Messaging**: Student-instructor communication system
- **Notifications**: Real-time alerts for course updates and messages
- **Grading System**: Comprehensive test and assignment grading
- **Answer Keys**: Secure distribution after test completion

### 📊 **Analytics & Dashboards**
- **Admin Dashboard**: Platform-wide metrics, revenue tracking, user management
- **Instructor Dashboard**: Course performance, earnings, student progress
- **Student Dashboard**: Learning progress, grades, enrolled courses
- **Payment Reports**: Detailed financial analytics with export capabilities
- **Billing Accounts**: Real-time balance and transaction history

### 🎨 **Modern UI/UX**
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Gradient Aesthetics**: Modern design with professional styling
- **Toast Notifications**: Non-intrusive user feedback
- **Loading States**: Smooth transitions and skeleton loaders
- **Accessibility**: WCAG-compliant interface design

## 👤 User Roles & Permissions

### 🔑 **Administrator**
**Complete platform control and oversight:**
- **User Management**: Create, update, delete users; manage roles and permissions
- **Course Oversight**: Monitor all courses, approve/reject instructor applications
- **Financial Control**: Process payouts, manage commissions, view revenue reports
- **Payment Approval**: Review and approve direct bank transfer payments
- **Live Sessions**: Manage all platform live sessions and recordings
- **Bulk Operations**: Efficient data cleanup with financial protection
- **System Settings**: Configure payment gateways, commission rates, annual fees
- **Analytics**: Platform-wide metrics, user activity, revenue tracking

### 👨‍🏫 **Instructor**
**Course creation and revenue generation:**
- **Course Creation**: Build courses with multimedia content (videos, PDFs, images)
- **Lesson Management**: Organize content with sections and lessons
- **Test & Grading**: Create tests with answer keys, grade submissions
- **Live Sessions**: Schedule Zoom meetings with automated student reminders
- **Payment Approval**: Approve direct transfer payments from students
- **Earnings Dashboard**: Track commissions, pending payouts, course revenue
- **Student Management**: Monitor progress, communicate, issue certificates
- **Billing Account**: View balance, request payouts, manage transactions

### 🎓 **Student**
**Seamless learning experience:**
- **Course Discovery**: Browse, search, filter courses by category, level, price
- **Flexible Payment**: Pay via Stripe, PayPal, or direct bank transfer
- **Learning Progress**: Track completion, access lessons, download materials
- **Live Participation**: Join Zoom sessions, receive automated reminders
- **Test Taking**: Submit tests, view grades, download answer keys
- **Certificates**: Receive completion certificates via email
- **Billing Management**: View purchase history, manage gift cards
- **Communication**: Message instructors, participate in discussions


## 🔗 API Overview

Mentora provides a comprehensive RESTful API with advanced security and rate limiting:

### Authentication & Authorization
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users` - Get all users (Admin)
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/instructor/:id/students` - Get instructor's students

### Course Management
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/user/enrolled` - Get user's enrolled courses

### Payment & Billing
- `POST /api/payments/initiate` - Initiate course payment
- `POST /api/payments/stripe/confirm` - Confirm Stripe payment
- `POST /api/payments/paypal/confirm` - Confirm PayPal payment
- `POST /api/payments/direct-transfer` - Submit direct transfer
- `POST /api/payments/:id/approve` - Approve payment (Admin/Instructor)
- `GET /api/specialized-billing/instructor/account` - Get instructor billing
- `GET /api/specialized-billing/student/account` - Get student billing
- `POST /api/specialized-billing/admin/process-instructor-payout` - Process payout

### Live Sessions
- `GET /api/live-sessions` - Get live sessions
- `POST /api/live-sessions` - Create live session
- `POST /api/live-sessions/:id/start` - Start session
- `POST /api/live-sessions/:id/end` - End session
- `POST /api/live-sessions/:id/recording` - Upload recording

### Certificates & Grading
- `GET /api/grades/student/:studentId` - Get student grades
- `POST /api/grades/final` - Assign final grade
- `POST /api/certificates/upload` - Upload certificate
- `GET /api/certificates/student/:studentId` - Get student certificates

> 📚 **Complete API Documentation**: See [documentation/API.md](documentation/API.md) for detailed endpoints, request/response examples, and authentication requirements.

## 🛠️ Technology Stack

### **Frontend Stack**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework with hooks | 18.2.0 |
| **Vite** | Build tool and dev server | Latest |
| **Redux Toolkit** | State management + RTK Query | 1.9.5 |
| **React Router** | Client-side routing | 6.14.2 |
| **Tailwind CSS** | Utility-first styling | 4.1.11 |
| **Lucide React** | Icon library | 0.263.1 |
| **React Toastify** | Toast notifications | 9.1.3 |
| **DOMPurify** | XSS protection | 3.2.6 |
| **Stripe Elements** | Payment UI components | Latest |
| **PayPal SDK** | PayPal integration | 8.9.1 |
| **Zoom Web SDK** | Video conferencing | 2.18.3 |
| **date-fns** | Date formatting | 4.1.0 |

### **Backend Stack**
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | JavaScript runtime | 18+ |
| **Express** | Web framework | 4.18.x |
| **MongoDB** | NoSQL database | 5.x |
| **Mongoose** | MongoDB ODM | 7.x |
| **JWT** | Authentication tokens | Latest |
| **bcryptjs** | Password hashing | 2.4.3 |
| **Stripe** | Payment processing | 18.5.0 |
| **PayPal SDK** | PayPal integration | 1.0.3 |
| **AWS SDK** | S3 file storage | 3.879.0 |
| **Cloudinary** | Media management | 2.x |
| **Nodemailer** | Email service | 6.9.x |
| **node-cron** | Scheduled tasks | 3.0.x |

### **Security & Validation**
| Technology | Purpose |
|------------|---------|
| **express-validator** | Input validation | 
| **express-rate-limit** | Rate limiting |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **helmet** | Security headers |
| **cors** | Cross-origin resource sharing |
| **isomorphic-dompurify** | Server-side XSS protection |

## 📋 Prerequisites & Requirements

### **System Requirements**
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | v18.0.0 | v20.0.0+ |
| **MongoDB** | v5.0 | v6.0+ |
| **RAM** | 4GB | 8GB+ |
| **Storage** | 2GB | 10GB+ |
| **OS** | Windows 10, macOS 10.15, Ubuntu 18.04 | Latest versions |

### **Required Services**
- **Cloudinary Account** - For image and video storage
- **AWS S3 Bucket** - For document and certificate storage
- **Stripe Account** (Optional) - For credit card payments
- **PayPal Business** (Optional) - For PayPal payments
- **Zoom Account** (Optional) - For live video sessions
- **SMTP Server** - For email notifications (Gmail, SendGrid, etc.)

## 🚀 Quick Start Guide

### **Step 1: Clone Repository**
```bash
git clone https://github.com/yourusername/mentora.git
cd mentora
```

### **Step 2: Environment Configuration**

**Backend (.env file in `/server`):**
```env
# Core Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Database
MONGO_URI=mongodb://localhost:27017/mentora
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/mentora

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Cloudinary (Images & Videos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (Documents & Certificates)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mentora-files

# Payment Gateways (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Zoom Integration (Optional)
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Frontend (.env file in `/client`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### **Step 3: Install Dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### **Step 4: Database Setup**
```bash
# Start MongoDB (choose your OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Seed database with sample data
cd server
npm run data
```

### **Step 5: Start Development Servers**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# ✅ Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# ✅ Client running on http://localhost:5173
```

### **Step 6: Access Application**
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5000/api
- 📚 **API Docs**: See `documentation/API.md`

### **Step 7: Test Accounts** (After seeding)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mail.com | 123456 |
| **Instructor** | instructor1@mail.com | 123456 |
| **Student** | student1@mail.com | 123456 |

## 📁 Project Structure

```
Mentora/
├── client/                 # React Frontend Application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── store/         # Redux store and slices
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── styles/        # Global styles and themes
│   │   └── config/        # Configuration files
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js Backend Application
│   ├── controllers/       # Route controllers
│   ├── models/           # Mongoose data models
│   ├── routes/           # API route definitions
│   ├── middleware/       # Custom middleware
│   ├── validations/      # Input validation schemas
│   ├── utils/            # Utility functions
│   ├── config/           # Database and app configuration
│   ├── seeders/          # Database seeding scripts
│   ├── uploads/          # File upload directory
│   ├── package.json
│   └── server.js         # Application entry point
├── .env.example          # Environment variables template
├── .gitignore
├── README.md
├── API.md                # API documentation
├── SECURITY.md           # Security guidelines
├── DEPLOYMENT.md         # Deployment instructions
└── user-stories.md       # User stories and requirements
```

## 🔧 Available Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run data       # Seed database with sample data
```

### Frontend Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🤝 Contributing

We welcome contributions to Mentora! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📞 Support

If you encounter any issues or have questions:

- 📧 Email: support@Mentora.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Mentora/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/Mentora/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the robust database
- All contributors who helped build this platform
- Open source community for inspiration and tools

---

**Built with ❤️ by the Mentora Team**
