/**
 * Zoom Authentication Utility
 * 
 * Handles Server-to-Server OAuth token generation for Zoom API
 */

const axios = require("axios");

/**
 * Get Zoom access token using Server-to-Server OAuth
 * @returns {Promise<string|null>} Access token or null if failed
 */
const getZoomAccessToken = async () => {
  try {
    const { ZOOM_API_KEY, ZOOM_API_SECRET, ZOOM_ACCOUNT_ID } = process.env;


    if (!ZOOM_API_KEY || !ZOOM_API_SECRET || !ZOOM_ACCOUNT_ID) {
      console.error("❌ Missing Zoom credentials in environment variables");
      return null;
    }

    const credentials = Buffer.from(`${ZOOM_API_KEY}:${ZOOM_API_SECRET}`).toString('base64');
    
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    
    return response.data.access_token;
    
  } catch (error) {
    console.error("❌ Error getting Zoom access token:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    return null;
  }
};

module.exports = getZoomAccessToken;
