/**
 * Utility functions for managing memory usage and preventing browser crashes
 */

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export const getMemoryUsage = (): MemoryInfo | null => {
  const perf = performance as ExtendedPerformance;
  if (perf.memory) {
    return {
      used: Math.round(perf.memory.usedJSHeapSize / 1048576),
      total: Math.round(perf.memory.totalJSHeapSize / 1048576),
      limit: Math.round(perf.memory.jsHeapSizeLimit / 1048576)
    };
  }
  return null;
};

export const getLocalStorageSize = () => {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return Math.round(total / 1024); // Return size in KB
};

export const cleanupImageData = (serves: Array<Record<string, unknown>>, keepRecentCount = 20) => {
  return serves.map((serve, index) => ({
    ...serve,
    // Only keep image data for most recent serves
    imageData: index < keepRecentCount ? serve.imageData : null
  }));
};

export const shouldSkipSync = () => {
  const memoryInfo = getMemoryUsage();
  const storageSize = getLocalStorageSize();
  
  // Skip sync if memory usage is high or localStorage is getting full
  if (memoryInfo && memoryInfo.used > 100) { // Over 100MB
    console.warn('High memory usage detected, skipping sync');
    return true;
  }
  
  if (storageSize > 8192) { // Over 8MB in localStorage
    console.warn('localStorage getting full, skipping sync');
    return true;
  }
  
  return false;
};

export const logMemoryStats = () => {
  const memory = getMemoryUsage();
  const storage = getLocalStorageSize();
  
  console.log('Memory Stats:', {
    jsHeap: memory ? `${memory.used}MB / ${memory.total}MB (limit: ${memory.limit}MB)` : 'Not available',
    localStorage: `${storage}KB`,
    timestamp: new Date().toISOString()
  });
};
