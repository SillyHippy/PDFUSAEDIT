import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { getMemoryUsage, getLocalStorageSize, logMemoryStats } from "@/utils/memoryUtils";
import { clearLocalStorage } from "@/utils/dataSwitch";

interface MemoryMonitorProps {
  onMemoryWarning?: () => void;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ onMemoryWarning }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [memoryStats, setMemoryStats] = useState<{
    jsHeap?: string;
    localStorage: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      const memory = getMemoryUsage();
      const storage = getLocalStorageSize();
      
      const stats = {
        jsHeap: memory ? `${memory.used}MB / ${memory.total}MB (limit: ${memory.limit}MB)` : 'Not available',
        localStorage: `${storage}KB`,
        timestamp: new Date().toISOString()
      };
      
      setMemoryStats(stats);
      
      // Show warning if memory usage is high
      if ((memory && memory.used > 100) || storage > 8192) {
        setShowWarning(true);
        onMemoryWarning?.();
      } else {
        setShowWarning(false);
      }
    };

    // Check memory immediately and then every 30 seconds
    checkMemory();
    const interval = setInterval(checkMemory, 30000);
    
    return () => clearInterval(interval);
  }, [onMemoryWarning]);

  const handleClearData = () => {
    const success = clearLocalStorage();
    if (success) {
      window.location.reload(); // Reload to reset everything
    }
  };

  const handleLogStats = () => {
    logMemoryStats();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Memory Warning</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          Your browser is using a lot of memory due to large amounts of serve data. 
          This may cause the app to become slow or crash (white screen).
        </p>
        {memoryStats && (
          <div className="text-xs mb-3 p-2 bg-background/50 rounded">
            <div>JS Heap: {memoryStats.jsHeap}</div>
            <div>localStorage: {memoryStats.localStorage}</div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearData}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear Local Data
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogStats}
          >
            Log Stats
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MemoryMonitor;
