import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Users, 
  Camera, 
  ClipboardList, 
  ArrowRight, 
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { ServeAttemptData } from "@/types/ServeAttemptData";
import { ClientData } from "@/components/ClientForm";
import ServeHistory from "@/components/ServeHistory";
import EditServeDialog from "@/components/EditServeDialog";
import MemoryMonitor from "@/components/MemoryMonitor";
import { appwrite } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { normalizeServeDataArray, mergeServeAndCaseData } from "@/utils/dataNormalization";
import { useIsMobile } from "@/hooks/use-mobile";
import { DB_ID, CASES_COLLECTION_ID } from "@/config/backendConfig";

interface DashboardProps {
  clients: ClientData[];
  serves: ServeAttemptData[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [recentServes, setRecentServes] = useState<ServeAttemptData[]>([]);
  const [editingServe, setEditingServe] = useState<ServeAttemptData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  // Fetch recent serves and all cases for merging
  useEffect(() => {
    const fetchRecentServesAndCases = async () => {
      try {
        setIsLoading(true);
        console.log("Dashboard: Fetching recent serves and all cases from Appwrite");
        
        // Fetch 6 most recent serves
        const appwriteServes = await appwrite.getServeAttempts(6, 0);
        console.log("Dashboard: Fetched serves from Appwrite:", appwriteServes?.length || 0);

        // Fetch all client cases to merge data
        const allCases = await appwrite.databases.listDocuments(DB_ID, CASES_COLLECTION_ID);
        console.log("Dashboard: Fetched all cases from Appwrite:", allCases.documents.length);
        
        if (appwriteServes && appwriteServes.length > 0) {
          const normalizedServes = normalizeServeDataArray(appwriteServes);
          
          // Merge serve data with case data
          const mergedServes = mergeServeAndCaseData(normalizedServes, allCases.documents);
          console.log("Dashboard: Merged serves with case data:", mergedServes.length);
          setRecentServes(mergedServes);
          
          // Calculate stats from merged serves
          const completed = mergedServes.filter(serve => serve.status === "completed").length;
          const pending = mergedServes.filter(serve => serve.status === "failed").length;
          setCompletedCount(completed);
          setPendingCount(pending);
          
          // Get today's serves from recent data
          const today = new Date();
          const todayStr = today.toLocaleDateString();
          const todayServes = mergedServes.filter(serve => {
            if (!serve.timestamp) return false;
            
            try {
              let serveDate: Date;
              if (typeof serve.timestamp === 'string') {
                serveDate = new Date(serve.timestamp);
              } else if (serve.timestamp instanceof Date) {
                serveDate = serve.timestamp;
              } else {
                // Handle any other timestamp format by converting to string first
                serveDate = new Date(String(serve.timestamp));
              }
              
              return serveDate.toLocaleDateString() === todayStr;
            } catch (error) {
              console.warn("Dashboard: Error parsing timestamp:", serve.timestamp, error);
              return false;
            }
          });
          
          setTodayCount(todayServes.length);
          console.log("Dashboard: Today's serves count:", todayServes.length);
        }
      } catch (error) {
        console.error("Dashboard: Error fetching data from Appwrite:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentServesAndCases();
  }, []);

  // Handle edit serve
  const handleEditServe = (serve: ServeAttemptData) => {
    console.log("Opening edit dialog for serve:", serve);
    setEditingServe(serve);
    setEditDialogOpen(true);
  };

  // Handle save edited serve
  const handleSaveServe = async (updatedServe: ServeAttemptData): Promise<boolean> => {
    console.log("Dashboard: Saving updated serve:", updatedServe);
    try {
      // Update using the appwrite utility function
      await appwrite.updateServeAttempt(updatedServe.id, updatedServe);
      
      console.log("Dashboard: Successfully updated serve in Appwrite");
      
      // Update local state
      setRecentServes(prevServes => 
        prevServes.map(serve => 
          serve.id === updatedServe.id ? updatedServe : serve
        )
      );
      
      toast({
        title: "Serve updated",
        description: "Service attempt has been updated successfully",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Dashboard: Error updating serve:", error);
      
      toast({
        title: "Error updating serve",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return (
    <div className={isMobile ? "" : "page-container"}>
      <MemoryMonitor />
      
      <div className={`mb-6 ${isMobile ? "text-center" : "text-center md:text-left"}`}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Process Server Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Track your serve attempts, manage clients, and send documentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="glass-card">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Clients</p>
                <h2 className="text-3xl font-bold mt-1">{clients.length}</h2>
              </div>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <Link to="/clients">
              <Button variant="ghost" className="w-full mt-3 text-xs">
                Manage Clients <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Today's Activity</p>
                <h2 className="text-3xl font-bold mt-1">{todayCount}</h2>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="h-1 w-full bg-muted mt-4 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min(todayCount * 10, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {todayCount === 0 
                ? "No serves today" 
                : `${todayCount} serve ${todayCount === 1 ? 'attempt' : 'attempts'} today`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Recent Status</p>
                <h2 className="text-3xl font-bold mt-1">{recentServes.length}</h2>
              </div>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 flex items-center gap-1.5 rounded-md bg-green-500/10 text-green-700 p-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5" />
                {completedCount} Completed
              </div>
              <div className="flex-1 flex items-center gap-1.5 rounded-md bg-amber-500/10 text-amber-700 p-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                {pendingCount} Pending
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight">Recent Serve Activity</h2>
            <Link to="/history">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <Card className="p-6 md:p-8 text-center">
              <p className="text-muted-foreground">Loading serve history...</p>
            </Card>
          ) : recentServes.length > 0 ? (
            <ServeHistory 
              serves={recentServes} 
              clients={clients} 
              onEdit={handleEditServe}
            />
          ) : (
            <Card className="neo-card">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[180px] md:min-h-[200px]">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Camera className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <CardTitle className="mb-2 text-base md:text-lg">No serve records yet</CardTitle>
                <CardDescription className="mb-4 text-xs md:text-sm">
                  Start a new serve attempt to create your first record
                </CardDescription>
                <Link to="/new-serve">
                  <Button>
                    <Camera className="mr-2 h-4 w-4" />
                    New Serve Attempt
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight">Quick Actions</h2>
          
          <div className="space-y-3 md:space-y-4">
            <Link to="/new-serve" className="block">
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="py-4 md:py-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">New Serve Attempt</CardTitle>
                    <CardDescription className="text-xs">
                      Capture photo with GPS data
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/clients" className="block">
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="py-4 md:py-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Manage Clients</CardTitle>
                    <CardDescription className="text-xs">
                      Add or edit client information
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/history" className="block">
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="py-4 md:py-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">View Serve History</CardTitle>
                    <CardDescription className="text-xs">
                      Review all past serve attempts
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Serve Dialog */}
      {editingServe && (
        <EditServeDialog
          serve={editingServe}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveServe}
        />
      )}
    </div>
  );
};

export default Dashboard;
