import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { useGenerateStreamingUrlMutation } from '../store/services/videoApi';

/**
 * Secure video player component with temporary URL handling
 */
const VideoPlayer = memo(({ lessonId, autoplay = false, className = '' }) => {
  const { user } = useSelector((state) => state.auth);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamingData, setStreamingData] = useState(null);
  const [quality, setQuality] = useState('auto');
  const [showControls, setShowControls] = useState(true);
  const [securityWarning, setSecurityWarning] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);
  
  // Redux API hook for video streaming
  const [generateStreamingUrl, { isLoading: streamingLoading }] = useGenerateStreamingUrlMutation();

  // Removed the problematic loadVideo callback that was causing re-render loops

  // Refresh token if needed (simplified for Redux API)
  const refreshTokenIfNeeded = useCallback(async () => {
    // Redux API handles token refresh automatically through the apiSlice
    // If the current video fails, we can try to reload it
    if (streamingData && videoRef.current) {
      try {
        console.log('🔄 Attempting to refresh video stream...');
        const newData = await generateStreamingUrl({ lessonId, quality }).unwrap();
        if (newData && videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          videoRef.current.src = newData.streamingUrl || newData.urls?.[quality] || newData.urls?.auto;
          videoRef.current.currentTime = currentTime;
          setStreamingData(newData);
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
      }
    }
  }, [lessonId, quality, generateStreamingUrl, streamingData]);

  // Initialize video (ONLY when lessonId changes - no other dependencies!)
  useEffect(() => {
    console.log('🎯 VideoPlayer useEffect triggered with lessonId:', lessonId, 'hasLoaded:', hasLoadedRef.current);
    
    if (!lessonId) {
      console.warn('⚠️ VideoPlayer mounted without lessonId');
      setError('No lesson ID provided');
      setLoading(false);
      return;
    }
    
    // Simple direct call - no debouncing, no complex logic
    const loadVideoForLesson = async () => {
      // Prevent duplicate calls in StrictMode - check inside the function
      if (hasLoadedRef.current || isLoadingVideo) {
        console.log('⚠️ Video already loading/loaded, skipping duplicate call');
        return;
      }
      
      hasLoadedRef.current = true; // Mark as loaded immediately
      
      try {
        setIsLoadingVideo(true);
        setLoading(true);
        setError(null);
        
        console.log('📡 Loading video for lesson:', lessonId);
        const data = await generateStreamingUrl({ lessonId, quality: 'auto' }).unwrap();
        console.log('✅ Video loaded successfully');
        console.log('📺 Full streaming data:', data);
        
        setStreamingData({ ...data, lessonId });
        
        // Wait for video element to be available
        const setVideoSource = () => {
          if (videoRef.current) {
            const videoUrl = data.streamingUrl || data.urls?.auto;
            console.log('📹 Video URL extracted:', videoUrl);
            console.log('📹 Data.streamingUrl:', data.streamingUrl);
            console.log('📹 Data.urls:', data.urls);
            console.log('📹 VideoRef exists:', !!videoRef.current);
            
            if (videoUrl) {
              videoRef.current.src = videoUrl;
              console.log('✅ Video source set successfully:', videoRef.current.src);
              
              // Force video element to load the new source
              videoRef.current.load();
              console.log('🔄 Video load() called');
            } else {
              console.error('❌ No video URL found in streaming data');
            }
            
            // Add video event listeners for debugging
            videoRef.current.addEventListener('loadstart', () => console.log('📹 Video loadstart'));
            videoRef.current.addEventListener('loadeddata', () => console.log('📹 Video loadeddata'));
            videoRef.current.addEventListener('canplay', () => console.log('📹 Video canplay'));
            videoRef.current.addEventListener('error', (e) => {
              console.error('❌ Video error:', e);
              console.error('Video error details:', videoRef.current.error);
            });
            
            // Security: Disable right-click context menu
            videoRef.current.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              setSecurityWarning(true);
              setTimeout(() => setSecurityWarning(false), 3000);
              return false;
            });
          } else {
            console.log('⚠️ VideoRef not ready, retrying in 100ms...');
            setTimeout(setVideoSource, 100);
          }
        };
        
        setVideoSource();
      } catch (err) {
        console.error('❌ Video loading failed:', err);
        setError('Failed to load video');
        hasLoadedRef.current = false; // Reset on error so retry can work
      } finally {
        setLoading(false);
        setIsLoadingVideo(false);
      }
    };
    
    // Use setTimeout to ensure this runs after any other synchronous effects
    const timeoutId = setTimeout(loadVideoForLesson, 0);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [lessonId]); // ONLY lessonId dependency
  
  // Reset hasLoaded when lessonId changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [lessonId]);
  
  // Separate useEffect for token refresh interval
  useEffect(() => {
    if (!streamingData) return;
    
    // Set up token refresh interval only when we have streaming data
    const refreshInterval = setInterval(refreshTokenIfNeeded, 300000); // Check every 5 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [streamingData, refreshTokenIfNeeded]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoplay) {
        handlePlay();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlay = async () => {
    if (videoRef.current) {
      try {
        console.log('🎬 Attempting to play video:', videoRef.current.src);
        console.log('📹 Video ready state:', videoRef.current.readyState);
        console.log('📹 Video network state:', videoRef.current.networkState);
        
        // Check if video has a source
        if (!videoRef.current.src) {
          console.error('❌ No video source available');
          return;
        }
        
        await videoRef.current.play();
        console.log('✅ Video play successful');
        setIsPlaying(true);
      } catch (error) {
        console.error('❌ Video play failed:', error);
        console.log('Video element state:', {
          src: videoRef.current.src,
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
          error: videoRef.current.error
        });
      }
    } else {
      console.error('❌ VideoRef is null in handlePlay');
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    // Note: Quality change will trigger a re-render and reload
  };

  // Format video duration for display
  const formatTime = (time) => {
    if (!time || time < 0) return '00:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div className={`bg-black rounded-lg flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="lg" text="Loading video..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center h-64 p-6 ${className}`}>
        <div className="text-red-500 mb-4">Failed to load video</div>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          return false;
        }}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        playsInline
        crossOrigin="anonymous"
      />

      {/* Dynamic Watermark Overlay */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-black/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {user?.email || user?.name || 'Mentora'}
        </div>
      </div>

      {/* Security Warning */}
      {securityWarning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Content Protected - Download Disabled</span>
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Play/Pause Button (Center) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className="bg-black/50 hover:bg-black/70 text-white border-0"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div 
            className="w-full h-2 bg-white/30 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white border-0 hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white border-0 hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Quality Selector */}
              {streamingData?.urls && (
                <select
                  value={quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="bg-black/50 text-white border border-white/30 rounded px-2 py-1 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="high">1080p</option>
                  <option value="medium">720p</option>
                  <option value="low">480p</option>
                </select>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white border-0 hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
