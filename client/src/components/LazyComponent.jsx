import React, { memo, Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Higher-order component for lazy loading React components
 */
const LazyComponent = memo(({ 
  component, 
  fallback = <LoadingSpinner size="lg" text="Loading..." />,
  errorFallback = <div className="text-center text-red-500">Failed to load component</div>,
  ...props 
}) => {
  const LazyLoadedComponent = lazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyLoadedComponent {...props} />
    </Suspense>
  );
});

LazyComponent.displayName = 'LazyComponent';

export default LazyComponent;
