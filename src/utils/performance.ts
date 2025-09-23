import React from 'react';

// Performance monitoring utilities for production

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark start of an operation
  markStart(operation: string): void {
    if (typeof performance !== 'undefined') {
      this.metrics.set(`${operation}_start`, performance.now());
    }
  }

  // Mark end of operation and calculate duration
  markEnd(operation: string): number | null {
    if (typeof performance === 'undefined') return null;

    const endTime = performance.now();
    const startTime = this.metrics.get(`${operation}_start`);
    
    if (startTime) {
      const duration = endTime - startTime;
      this.metrics.set(`${operation}_duration`, duration);
      
      // Log slow operations in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    
    return null;
  }

  // Get performance metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear();
  }
}

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Track LCP (Largest Contentful Paint)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.info('LCP:', entry.startTime);
      }
      if (entry.entryType === 'first-input') {
        const fidEntry = entry as any;
        console.info('FID:', fidEntry.processingStart - entry.startTime);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  } catch (e) {
    // Observer not supported
  }
};

// Component render time tracker
export const withPerformanceTracking = <T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) => {
  return (props: T) => {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.markStart(`render_${componentName}`);
      
      return () => {
        monitor.markEnd(`render_${componentName}`);
      };
    });

    return React.createElement(WrappedComponent, props);
  };
};