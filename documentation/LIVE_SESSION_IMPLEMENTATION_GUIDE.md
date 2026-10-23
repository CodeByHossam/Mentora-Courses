# Live Session Feature Implementation Guide

## 🎯 Overview

This guide provides a complete implementation of live session functionality for LearnTrack, including:
- Session scheduling and management
- Zoom Web SDK integration
- Email reminder system
- Recording management
- Real-time participant tracking

## 📁 Files Created/Modified

### Backend Files

#### Models
- `server/models/liveSessionModel.js` - MongoDB schema for live sessions

#### Controllers
- `server/controllers/liveSessionController.js` - CRUD operations and session management
- `server/controllers/zoomController.js` - Zoom Web SDK integration

#### Routes
- `server/routes/liveSessionRoutes.js` - API endpoints for live sessions
- `server/routes/zoomRoutes.js` - Zoom integration endpoints

#### Validation
- `server/validations/liveSessionValidation.js` - Input validation using express-validator

#### Services
- `server/services/reminderService.js` - Automated email reminder system

#### Server Configuration
- `server/server.js` - Updated to include new routes and reminder service

### Frontend Files

#### API Services
- `client/src/store/services/liveSessionApi.js` - RTK Query API service
- `client/src/store/api/apiSlice.js` - Updated with LiveSession tag

#### Components
- `client/src/components/LiveSession/ScheduleSessionForm.jsx` - Session scheduling form
- `client/src/components/LiveSession/InstructorSessions.jsx` - Instructor session management
- `client/src/components/LiveSession/StudentSessions.jsx` - Student session viewing
- `client/src/components/LiveSession/CourseLiveSessions.jsx` - Course-specific sessions
- `client/src/components/LiveSession/SessionRecordingUpload.jsx` - Recording upload form
- `client/src/components/LiveSession/ZoomMeeting.jsx` - Zoom Web SDK integration

## 🚀 Installation Steps

### 1. Install Dependencies

#### Backend Dependencies
```bash
cd server
npm install node-cron axios jsonwebtoken
```

#### Frontend Dependencies
```bash
cd client
npm install @zoomus/websdk react-toastify
```

### 2. Environment Configuration

#### Server `.env`
```env
# Zoom Integration
ZOOM_API_KEY=your_zoom_api_key_here
ZOOM_API_SECRET=your_zoom_api_secret_here

# Email Configuration (if not already set)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

#### Client `.env`
```env
REACT_APP_ZOOM_API_KEY=your_zoom_api_key_here
```

### 3. Zoom App Setup

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a new "SDK App"
3. Configure app settings:
   - App Type: SDK App
   - SDK Type: Web SDK
   - Add your domain to allowlist
4. Get API Key and Secret

## 📊 Database Schema

### LiveSession Model Fields

```javascript
{
  title: String (required, 3-100 chars)
  description: String (required, 10-1000 chars)
  course: ObjectId (ref: Course, required)
  instructor: ObjectId (ref: User, required)
  scheduledDate: Date (required, min 1 hour advance)
  duration: Number (required, 15-480 minutes, 15-min increments)
  sessionType: String (enum: lecture, workshop, qa, review, exam)
  status: String (enum: scheduled, live, completed, cancelled)
  
  // Zoom integration
  zoomMeetingId: String
  zoomJoinUrl: String
  zoomStartUrl: String
  zoomPassword: String
  
  // Session management
  maxParticipants: Number (default: 100)
  participants: [{ user, joinedAt, leftAt, duration }]
  
  // Recording
  recordingUrl: String
  recordingPassword: String
  isRecorded: Boolean
  isRecordingPublic: Boolean
  
  // Metadata
  actualStartTime: Date
  actualEndTime: Date
  reminderSent: Boolean
  reminderSentAt: Date
  instructorNotes: String
}
```

## 🔌 API Endpoints

### Live Session Management

```
POST   /api/live-sessions              - Create session
GET    /api/live-sessions/course/:id   - Get course sessions
GET    /api/live-sessions/instructor   - Get instructor sessions
GET    /api/live-sessions/student      - Get student sessions
GET    /api/live-sessions/:id          - Get single session
PUT    /api/live-sessions/:id          - Update session
DELETE /api/live-sessions/:id          - Delete session

POST   /api/live-sessions/:id/join     - Join session
POST   /api/live-sessions/:id/leave    - Leave session
POST   /api/live-sessions/:id/start    - Start session
POST   /api/live-sessions/:id/end      - End session
POST   /api/live-sessions/:id/recording - Upload recording
```

### Zoom Integration

```
POST   /api/zoom/signature             - Generate Zoom signature
GET    /api/zoom/meeting/:id           - Get meeting details
POST   /api/zoom/webhook               - Zoom webhook handler
```

## 🎨 Frontend Integration

### Using Components

#### Instructor Dashboard
```jsx
import InstructorSessions from '../components/LiveSession/InstructorSessions';

// In your instructor dashboard
<InstructorSessions courseId={courseId} />
```

#### Student Dashboard
```jsx
import StudentSessions from '../components/LiveSession/StudentSessions';

// In your student dashboard
<StudentSessions />
```

#### Course Details Page
```jsx
import CourseLiveSessions from '../components/LiveSession/CourseLiveSessions';

// In course details
<CourseLiveSessions 
  courseId={courseId} 
  isEnrolled={isEnrolled} 
/>
```

### API Usage Examples

#### Schedule a Session
```jsx
const [createSession] = useCreateLiveSessionMutation();

const scheduleSession = async (sessionData) => {
  try {
    const result = await createSession({
      title: "Advanced React Concepts",
      description: "Deep dive into React hooks and patterns",
      courseId: "course_id_here",
      scheduledDate: "2024-01-15T14:00:00Z",
      duration: 90,
      sessionType: "lecture"
    }).unwrap();
    
    console.log('Session scheduled:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Join a Session
```jsx
const [joinSession] = useJoinLiveSessionMutation();

const handleJoinSession = async (sessionId) => {
  try {
    const result = await joinSession(sessionId).unwrap();
    
    // Open Zoom meeting
    if (result.data?.zoomJoinUrl) {
      window.open(result.data.zoomJoinUrl, '_blank');
    }
  } catch (error) {
    console.error('Error joining session:', error);
  }
};
```

## 📧 Email Reminder System

The reminder service automatically sends emails at:
- **24 hours before** - Daily reminder
- **1 hour before** - Final preparation reminder  
- **15 minutes before** - Last call reminder
- **Session start** - Join now notification

### Reminder Schedule
```javascript
// 24-hour reminders: Daily at 9 AM
cron.schedule('0 9 * * *', send24HourReminders);

// 1-hour reminders: Every hour
cron.schedule('0 * * * *', send1HourReminders);

// 15-minute reminders: Every 15 minutes
cron.schedule('*/15 * * * *', send15MinuteReminders);

// Starting now: Every 5 minutes
cron.schedule('*/5 * * * *', sendStartingNowReminders);
```

## 🔒 Security Features

### Input Validation
- Express-validator for all endpoints
- XSS protection with input sanitization
- MongoDB injection prevention
- File upload restrictions

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Course enrollment verification
- Session participant validation

### Zoom Integration Security
- Server-side signature generation
- Meeting access verification
- Webhook signature validation
- Token-based authentication

## 🎯 Usage Scenarios

### For Instructors

1. **Schedule Session**
   - Navigate to course dashboard
   - Click "Schedule Live Session"
   - Fill in session details
   - System creates Zoom meeting automatically

2. **Manage Sessions**
   - View upcoming/past sessions
   - Start sessions 15 minutes early
   - End sessions manually
   - Upload recordings post-session

3. **Monitor Participation**
   - See real-time participant count
   - Track attendance duration
   - Export session reports

### For Students

1. **View Sessions**
   - See upcoming sessions in dashboard
   - Get countdown timers
   - Receive email reminders

2. **Join Sessions**
   - Join 15 minutes before start
   - One-click Zoom integration
   - Automatic attendance tracking

3. **Access Recordings**
   - Watch past session recordings
   - Password-protected access
   - Course-specific organization

## 🔧 Customization Options

### Session Types
- Lecture (default)
- Workshop
- Q&A Session
- Review Session
- Exam

### Duration Options
- 15 minutes to 8 hours
- 15-minute increments
- Configurable maximums

### Participant Limits
- 1 to 500 participants
- Course enrollment based
- Instructor configurable

## 🐛 Troubleshooting

### Common Issues

1. **Zoom SDK Not Loading**
   - Check API key configuration
   - Verify domain allowlist
   - Ensure HTTPS in production

2. **Email Reminders Not Sending**
   - Verify email credentials
   - Check cron job status
   - Review server logs

3. **Session Join Failures**
   - Confirm user enrollment
   - Check session timing
   - Validate Zoom meeting ID

### Debug Commands

```bash
# Check reminder service status
curl http://localhost:5000/api/live-sessions/instructor

# Test email configuration
node -e "require('./server/utils/emailSender')({to:'test@example.com',subject:'Test',text:'Hello'})"

# Verify Zoom credentials
curl -X POST http://localhost:5000/api/zoom/signature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"meetingNumber":"123456789"}'
```

## 🚀 Deployment Notes

### Production Considerations

1. **Environment Variables**
   - Use secure credential storage
   - Separate dev/prod Zoom apps
   - Configure proper CORS origins

2. **Scaling**
   - Consider Redis for session state
   - Implement connection pooling
   - Use CDN for static assets

3. **Monitoring**
   - Set up error tracking
   - Monitor email delivery
   - Track session metrics

### Performance Optimization

1. **Database Indexes**
   - Already included in model
   - Monitor query performance
   - Consider compound indexes

2. **Caching**
   - Cache session lists
   - Store Zoom signatures
   - Use Redis for real-time data

3. **CDN Integration**
   - Serve Zoom SDK from CDN
   - Cache static components
   - Optimize image delivery

## 📈 Future Enhancements

### Potential Features

1. **Advanced Analytics**
   - Session engagement metrics
   - Attendance reports
   - Performance dashboards

2. **Interactive Features**
   - Live polls and quizzes
   - Breakout rooms
   - Screen sharing controls

3. **Integration Improvements**
   - Calendar synchronization
   - Mobile app support
   - Third-party LMS integration

4. **AI Features**
   - Automatic transcription
   - Session summaries
   - Content recommendations

This implementation provides a robust, scalable live session feature that integrates seamlessly with your existing LearnTrack application. The modular design allows for easy customization and future enhancements.
