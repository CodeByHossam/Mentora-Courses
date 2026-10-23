import React, { memo, useState, useRef, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';

/**
 * Lazy loading image component with fallback and loading states
 */
const LazyImage = memo(({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/placeholder.jpg',
  loadingClassName = '',
  errorClassName = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState('');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg) return;
    
    // If no src provided, immediately show error state
    if (!src) {
      setImageState('error');
      return;
    }

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start loading the image
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(src);
              setImageState('loaded');
              onLoad?.();
            };
            
            img.onerror = () => {
              if (fallbackSrc && fallbackSrc !== src) {
                // Try fallback image
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                  setImageSrc(fallbackSrc);
                  setImageState('loaded');
                };
                fallbackImg.onerror = () => {
                  setImageState('error');
                  onError?.();
                };
                fallbackImg.src = fallbackSrc;
              } else {
                setImageState('error');
                onError?.();
              }
            };
            
            img.src = src;
            
            // Stop observing once we start loading
            observerRef.current?.unobserve(currentImg);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, fallbackSrc, onLoad, onError]);

  const baseClasses = `transition-opacity duration-300 ${className}`;

  if (imageState === 'loading') {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 ${baseClasses} ${loadingClassName}`}
        {...props}
      >
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (imageState === 'error') {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 ${baseClasses} ${errorClassName}`}
        {...props}
      >
        <BookOpen className="w-8 h-8 text-white" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${baseClasses} opacity-100`}
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
