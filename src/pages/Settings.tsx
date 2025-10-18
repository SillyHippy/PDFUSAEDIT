import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, Trash2, Database, HardDrive, Cloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { clearLocalStorage } from "@/utils/dataSwitch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(() => {
    return localStorage.getItem('useLocalStorageFallback') === 'true';
  });
  
  const handleClearLocalStorage = async () => {
    setIsClearing(true);
    try {
      const success = clearLocalStorage();
      
      if (success) {
        toast({
          title: "Local storage cleared",
          description: "All local data has been reset successfully",
          variant: "default"
        });
      } else {
        throw new Error("Failed to clear local storage");
      }
    } catch (error) {
      console.error("Error clearing local storage:", error);
      toast({
        title: "Error",
        description: "Failed to clear local storage",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  const handleOfflineModeToggle = (enabled: boolean) => {
    setOfflineMode(enabled);
    if (enabled) {
      localStorage.setItem('useLocalStorageFallback', 'true');
      toast({
        title: "Offline Mode Enabled",
        description: "Application will use local storage for data operations",
        variant: "default"
      });
    } else {
      localStorage.removeItem('useLocalStorageFallback');
      toast({
        title: "Online Mode Enabled",
        description: "Application will use Appwrite for data operations",
        variant: "default"
      });
      // Refresh page to re-establish connection
      window.location.reload();
    }
  };

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    
    // Force a hard refresh of the page
    window.location.reload();
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and data
        </p>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>
              Configure how the application connects to the backend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the app will operate using local storage only
                </p>
              </div>
              <Switch
                id="offline-mode"
                checked={offlineMode}
                onCheckedChange={handleOfflineModeToggle}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Connection Status</h3>
                  <p className="text-sm text-muted-foreground">Refresh connection to backend</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleHardRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Connection
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-md">
                {offlineMode ? (
                  <>
                    <HardDrive className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-500 font-medium text-sm">Using Local Storage</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium text-sm">Connected to Appwrite</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Local Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Clear all locally stored data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Local Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear local storage?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all data stored in your browser's local storage. 
                      This action cannot be undone. Data stored in the Appwrite backend will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearLocalStorage}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isClearing}
                    >
                      {isClearing ? "Clearing..." : "Clear Data"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Data Migration</h3>
              <p className="text-sm text-muted-foreground">
                Transfer data between local storage and Appwrite backend
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/migration")}
                className="w-full sm:w-auto"
              >
                <Database className="mr-2 h-4 w-4" />
                Data Migration Tool
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Application information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Version</h3>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Database Provider</h3>
                <p className="text-sm text-muted-foreground">Appwrite</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Storage Provider</h3>
                <p className="text-sm text-muted-foreground">Appwrite Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
