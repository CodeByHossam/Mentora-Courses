# Mentora-Courses — Performance Report

## Build (Vite)
- Main JS: ~1,229 kB (gzip ~283 kB)
- Multiple route chunks split (good)
- CSS included in build

## Findings
- Large main chunk; consider manualChunks for vendor libs (React, Redux, Stripe, Zoom).
- Route-level splitting exists but vendor bundling is heavy.

## Recommendations
- Configure `rollupOptions.output.manualChunks` to split vendors
- Lazy-load Zoom/WebSDK and Stripe components
- Optimize images/assets, use compression
- Add preconnect/prefetch for critical resources
