
import React, { useState, useEffect } from "react";
import ServeHistory from "@/components/ServeHistory";
import MemoryMonitor from "@/components/MemoryMonitor";
import { ClientData } from "@/components/ClientForm";
import { ServeAttemptData } from "@/types/ServeAttemptData";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditServeDialog from "@/components/EditServeDialog";
import { appwrite } from "@/lib/appwrite";
import { normalizeServeDataArray, addClientNamesToServes } from "@/utils/dataNormalization";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface HistoryProps {
  serves: ServeAttemptData[];
  clients: ClientData[];
  deleteServe: (id: string) => Promise<boolean>;
  updateServe: (serve: ServeAttemptData) => Promise<boolean>;
}

const SERVES_PER_PAGE = 20; // Limit to 20 serves per page to prevent memory issues

const History: React.FC<HistoryProps> = ({ 
  clients, 
  deleteServe,
  updateServe
}) => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedServe, setSelectedServe] = useState<ServeAttemptData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [localServes, setLocalServes] = useState<ServeAttemptData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalServes, setTotalServes] = useState(0);
  const { toast } = useToast();

  // Calculate pagination
  const totalPages = Math.ceil(totalServes / SERVES_PER_PAGE);
  const offset = (currentPage - 1) * SERVES_PER_PAGE;

  // Fetch paginated serves
  useEffect(() => {
    fetchServeHistory();
  }, [currentPage, clients]);

  const fetchServeHistory = async () => {
    try {
      console.log(`Fetching serves for page ${currentPage}...`);
      setIsSyncing(true);
      
      // Fetch paginated serves from Appwrite
      const appwriteServes = await appwrite.getServeAttempts(SERVES_PER_PAGE, offset);
      console.log("Fetched serves:", appwriteServes?.length || 0);
      
      if (appwriteServes && appwriteServes.length > 0) {
        const validatedServes = validateServes(appwriteServes);
        const enhancedServes = addClientNamesToServes(validatedServes, clients);
        const sortedServes = sortServesByDate(enhancedServes);
        setLocalServes(sortedServes);
        
        // Get total count for pagination (only fetch once)
        if (currentPage === 1) {
          try {
            const totalCount = await appwrite.getTotalServeAttemptsCount();
            setTotalServes(totalCount);
          } catch (error) {
            console.error("Error getting total count:", error);
            setTotalServes(appwriteServes.length); // Fallback
          }
        }
      } else {
        setLocalServes([]);
        if (currentPage === 1) {
          setTotalServes(0);
        }
      }
    } catch (error) {
      console.error("Error fetching serve history:", error);
      toast({
        title: "Error",
        description: "Failed to load serve history.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const sortServesByDate = (servesToSort: ServeAttemptData[]): ServeAttemptData[] => {
    return [...servesToSort].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  };

  const handleRefresh = async () => {
    if (isSyncing) return;
    await fetchServeHistory();
    toast({
      title: "History Refreshed",
      description: "Serve history has been updated with the latest data."
    });
  };

  const handleEditServe = (serve: ServeAttemptData) => {
    setSelectedServe(serve);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteServe(id);
      if (success) {
        toast({
          title: "Success",
          description: "Serve attempt has been deleted",
          variant: "default"
        });
        
        // Refresh current page
        await fetchServeHistory();
      } else {
        throw new Error("Failed to delete serve attempt");
      }
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error",
        description: "Failed to delete serve attempt",
        variant: "destructive"
      });
    }
  };

  const validateServes = (serves: ServeAttemptData[]): ServeAttemptData[] => {
    console.log("Validating serve attempts:", serves);
    if (!serves || !Array.isArray(serves)) {
      console.warn("No valid serves array provided");
      return [];
    }

    const normalizedServes = normalizeServeDataArray(serves);
    const uniqueServes = new Map();
    
    normalizedServes.forEach((serve) => {
      if (!serve.id) {
        console.warn("Serve attempt missing ID:", serve);
        return;
      }

      if (uniqueServes.has(serve.id)) {
        console.warn(`Duplicate serve detected: ${serve.id}`);
        return;
      }

      uniqueServes.set(serve.id, serve);
    });

    const validated = Array.from(uniqueServes.values());
    console.log("Validated serve attempts after filtering:", validated);
    return validated;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="page-container">
      <MemoryMonitor />
      
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Serve History</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/export")}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-muted-foreground">
          View your serve history and outcomes (Page {currentPage} of {totalPages}, Total: {totalServes})
        </p>
      </div>

      {isSyncing ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Loading serve history...</h3>
          <p className="text-muted-foreground">
            Please wait while we fetch your data
          </p>
        </div>
      ) : localServes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HistoryIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No serve history yet</h3>
          <p className="mb-6 text-muted-foreground">
            Create your first serve attempt to see your history here
          </p>
          <Button onClick={() => navigate("/new-serve")}>
            Create Serve Attempt
          </Button>
        </div>
      ) : (
        <>
          <ServeHistory 
            serves={localServes} 
            clients={clients} 
            onDelete={handleDelete}
            onEdit={handleEditServe} 
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {selectedServe && (
        <EditServeDialog
          serve={selectedServe}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={updateServe}
        />
      )}
    </div>
  );
};

export default History;
