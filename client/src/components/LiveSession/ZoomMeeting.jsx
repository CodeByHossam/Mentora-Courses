/**
 * Zoom Meeting Component
 * 
 * Integrates Zoom Web SDK for in-browser video conferencing
 */

import React, { useEffect, useRef, useState } from 'react';
import { ZoomMtg } from '@zoomus/websdk';

const ZoomMeeting = ({ 
  meetingNumber, 
  userName, 
  userEmail, 
  passWord = '', 
  role = 0, // 0 for attendee, 1 for host
  onMeetingEnd,
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const meetingContainerRef = useRef(null);

  useEffect(() => {
    const initializeZoom = async () => {
      try {
        // Zoom Web SDK configuration
        ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Generate signature (this should be done on the server for security)
        const signature = await generateSignature(meetingNumber, role);

        if (!signature) {
          throw new Error('Failed to generate meeting signature');
        }

        // Initialize Zoom meeting
        ZoomMtg.init({
          leaveUrl: window.location.origin,
          success: () => {
            joinMeeting(signature);
          },
          error: (error) => {
            console.error('Zoom SDK initialization failed:', error);
            setError('Failed to initialize Zoom SDK');
            setIsLoading(false);
            if (onError) onError(error);
          }
        });

      } catch (error) {
        console.error('Error initializing Zoom:', error);
        setError(error.message);
        setIsLoading(false);
        if (onError) onError(error);
      }
    };

    const joinMeeting = (signature) => {
      ZoomMtg.join({
        signature: signature,
        meetingNumber: meetingNumber,
        userName: userName,
        apiKey: process.env.REACT_APP_ZOOM_API_KEY,
        userEmail: userEmail,
        passWord: passWord,
        tk: '',
        success: (success) => {
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Failed to join Zoom meeting:', error);
          setError('Failed to join meeting');
          setIsLoading(false);
          if (onError) onError(error);
        }
      });
    };

    const generateSignature = async (meetingNumber, role) => {
      try {
        // In production, this should be done on the server for security
        const response = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            meetingNumber: meetingNumber,
            role: role
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate signature');
        }

        const data = await response.json();
        return data.signature;
      } catch (error) {
        console.error('Error generating signature:', error);
        // Fallback: generate signature on client side (not recommended for production)
        return generateClientSignature(meetingNumber, role);
      }
    };

    const generateClientSignature = (meetingNumber, role) => {
      // This is a simplified version - in production, use server-side generation
      const iat = Math.round(new Date().getTime() / 1000) - 30;
      const exp = iat + 60 * 60 * 2; // 2 hours

      const oHeader = { alg: 'HS256', typ: 'JWT' };
      const oPayload = {
        iss: process.env.REACT_APP_ZOOM_API_KEY,
        exp: exp,
        iat: iat,
        aud: 'zoom',
        appKey: process.env.REACT_APP_ZOOM_API_KEY,
        tokenExp: exp,
        alg: 'HS256'
      };

      // Note: This requires a JWT library and should be done server-side
      // For now, we'll return null to indicate server-side generation is needed
      console.warn('Client-side signature generation not implemented. Please implement server-side signature generation.');
      return null;
    };

    if (meetingNumber && userName) {
      initializeZoom();
    }

    // Cleanup function
    return () => {
      try {
        ZoomMtg.leaveMeeting({
          success: () => {
            if (onMeetingEnd) onMeetingEnd();
          },
          error: (error) => {
            console.error('Error leaving meeting:', error);
          }
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [meetingNumber, userName, userEmail, passWord, role, onMeetingEnd, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Joining Meeting...
          </h3>
          <p className="text-gray-600">
            Please wait while we connect you to the live session
          </p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>📹 Initializing video...</p>
            <p>🎤 Setting up audio...</p>
            <p>🔗 Connecting to meeting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Meeting Connection Failed
          </h3>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zoom-meeting-container">
      {/* Zoom Web SDK will render the meeting interface here */}
      <div 
        ref={meetingContainerRef}
        id="zmmtg-root" 
        className="w-full h-screen"
      />
      
      {/* Custom overlay for meeting controls (optional) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomMeeting;
