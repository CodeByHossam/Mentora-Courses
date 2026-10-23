import React, { memo, useState, useRef, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Performance-optimized image component with lazy loading, WebP support, and responsive sizing
 */
const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  onLoad,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate responsive image sources
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const baseUrl = baseSrc.split('?')[0];
    const params = new URLSearchParams(baseSrc.split('?')[1] || '');
    
    return widths.map(w => {
      const newParams = new URLSearchParams(params);
      newParams.set('w', w.toString());
      newParams.set('q', quality.toString());
      return `${baseUrl}?${newParams.toString()} ${w}w`;
    }).join(', ');
  };

  // Generate WebP source
  const generateWebPSrc = (baseSrc) => {
    if (!baseSrc) return '';
    
    const params = new URLSearchParams(baseSrc.split('?')[1] || '');
    params.set('fm', 'webp');
    params.set('q', quality.toString());
    
    return `${baseSrc.split('?')[0]}?${params.toString()}`;
  };

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg || !src) return;

    // If priority loading, load immediately
    if (priority) {
      loadImage();
      return;
    }

    // Otherwise use intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.unobserve(currentImg);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(currentImg);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setImageState('loaded');
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageState('error');
      onError?.();
    };
    
    // Try WebP first, fallback to original
    const webpSrc = generateWebPSrc(src);
    img.src = webpSrc || src;
  };

  const renderPlaceholder = () => {
    if (placeholder === 'blur') {
      return (
        <div 
          className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
          style={{ width, height }}
          {...props}
        >
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      );
    }
    
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
        {...props}
      >
        <ImageOff className="w-8 h-8 text-gray-400" />
      </div>
    );
  };

  const renderError = () => (
    <div 
      className={`bg-gray-100 flex items-center justify-center ${className}`}
      style={{ width, height }}
      {...props}
    >
      <ImageOff className="w-8 h-8 text-gray-400" />
    </div>
  );

  if (imageState === 'loading') {
    return (
      <div ref={imgRef}>
        {renderPlaceholder()}
      </div>
    );
  }

  if (imageState === 'error') {
    return renderError();
  }

  return (
    <picture>
      {/* WebP source */}
      <source
        srcSet={generateSrcSet(generateWebPSrc(src))}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback source */}
      <source
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        type="image/jpeg"
      />
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
