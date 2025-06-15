import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Edit, Trash2, Upload } from "lucide-react";
import { appwrite } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { ClientData } from "./ClientForm";
import ClientDocuments from "./ClientDocuments";
import ServeHistory from "./ServeHistory";
import AffidavitGenerator from "./AffidavitGenerator";
import EditCaseDialog from "./EditCaseDialog";
import { mergeServeAndCaseData } from "@/utils/dataNormalization";
import { ServeAttemptData } from "@/types/ServeAttemptData";

interface ClientCase {
  $id: string;
  client_id: string;
  case_number: string;
  case_name: string;
  court_name?: string;
  plaintiff_petitioner?: string;
  defendant_respondent?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  home_address?: string;
  work_address?: string;
}

interface ClientCasesProps {
  client: ClientData;
  onUpdate: () => void;
  clientCases?: ClientCase[];
  setClientCases?: (cases: ClientCase[]) => void;
}

export default function ClientCases({ client, onUpdate, clientCases = [], setClientCases }: ClientCasesProps) {
  const [serves, setServes] = useState<ServeAttemptData[]>([]);
  const [newCase, setNewCase] = useState({
    case_number: "",
    case_name: "",
    court_name: "",
    plaintiff_petitioner: "",
    defendant_respondent: "",
    notes: "",
    status: "active"
  });
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch serves for this client
  useEffect(() => {
    const fetchServes = async () => {
      try {
        console.log("Fetching serves for client:", client.id);
        const allServes = await appwrite.getServeAttempts();
        const clientServes = allServes.filter(serve => serve.clientId === client.id);
        console.log("Client serves:", clientServes);
        setServes(clientServes as ServeAttemptData[]);
      } catch (error) {
        console.error("Error fetching serves:", error);
        setServes([]);
      }
    };

    if (client.id) {
      fetchServes();
    }
  }, [client.id]);

  const handleCreateCase = async () => {
    try {
      console.log("Creating new case:", newCase);
      const caseData = {
        client_id: client.id,
        ...newCase
      };
      
      const createdCase = await appwrite.createClientCase(caseData);
      console.log("Case created:", createdCase);
      
      if (setClientCases) {
        setClientCases([...clientCases, createdCase]);
      }
      
      setNewCase({
        case_number: "",
        case_name: "",
        court_name: "",
        plaintiff_petitioner: "",
        defendant_respondent: "",
        notes: "",
        status: "active"
      });
      setIsAddingCase(false);
      
      toast({
        title: "Case created",
        description: "New case has been added successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating case:", error);
      toast({
        title: "Error creating case",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const updateCase = async (caseData: any) => {
    try {
      console.log("Updating case:", caseData);
      const updatedCase = await appwrite.updateCase(caseData.id, caseData);
      console.log("Case updated:", updatedCase);
      
      if (setClientCases) {
        setClientCases(clientCases.map(c => c.$id === caseData.id ? updatedCase : c));
      }
      
      toast({
        title: "Case updated",
        description: "Case has been updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating case:", error);
      toast({
        title: "Error updating case",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deleteCase = async (caseId: string) => {
    try {
      await appwrite.deleteClientCase(caseId);
      if (setClientCases) {
        setClientCases(clientCases.filter(c => c.$id !== caseId));
      }
      toast({
        title: "Case deleted",
        description: "Case has been removed successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        title: "Error deleting case",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deleteServe = async (serveId: string) => {
    try {
      await appwrite.deleteServeAttempt(serveId);
      setServes(prev => prev.filter(s => s.id !== serveId));
      toast({
        title: "Serve deleted",
        description: "Service attempt has been removed",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting serve:", error);
      toast({
        title: "Error deleting serve",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const updateServe = async (serveData: any) => {
    try {
      await appwrite.updateServeAttempt(serveData.id, serveData);
      // Refresh serves
      const allServes = await appwrite.getServeAttempts();
      const clientServes = allServes.filter(serve => serve.clientId === client.id);
      setServes(clientServes as ServeAttemptData[]);
      toast({
        title: "Serve updated",
        description: "Service attempt has been updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating serve:", error);
      toast({
        title: "Error updating serve",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const mergedServes = mergeServeAndCaseData(serves, clientCases);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="cases" className="w-full">
        <TabsList>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="serves">Service History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Client Cases</h3>
            <Dialog open={isAddingCase} onOpenChange={setIsAddingCase}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Case
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Case</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="case_number">Case Number</Label>
                    <Input
                      id="case_number"
                      value={newCase.case_number}
                      onChange={(e) => setNewCase(prev => ({ ...prev, case_number: e.target.value }))}
                      placeholder="Enter case number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="case_name">Case Name</Label>
                    <Input
                      id="case_name"
                      value={newCase.case_name}
                      onChange={(e) => setNewCase(prev => ({ ...prev, case_name: e.target.value }))}
                      placeholder="Enter case name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="court_name">Court Name</Label>
                    <Input
                      id="court_name"
                      value={newCase.court_name}
                      onChange={(e) => setNewCase(prev => ({ ...prev, court_name: e.target.value }))}
                      placeholder="Enter court name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plaintiff_petitioner">Plaintiff/Petitioner</Label>
                    <Input
                      id="plaintiff_petitioner"
                      value={newCase.plaintiff_petitioner}
                      onChange={(e) => setNewCase(prev => ({ ...prev, plaintiff_petitioner: e.target.value }))}
                      placeholder="Enter plaintiff/petitioner"
                    />
                  </div>
                  <div>
                    <Label htmlFor="defendant_respondent">Defendant/Respondent</Label>
                    <Input
                      id="defendant_respondent"
                      value={newCase.defendant_respondent}
                      onChange={(e) => setNewCase(prev => ({ ...prev, defendant_respondent: e.target.value }))}
                      placeholder="Enter defendant/respondent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newCase.notes}
                      onChange={(e) => setNewCase(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter case notes"
                    />
                  </div>
                  <Button onClick={handleCreateCase} className="w-full">
                    Create Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {clientCases.map((clientCase) => {
              // Filter serves for this specific case
              const caseServes = serves.filter(serve => serve.caseNumber === clientCase.case_number);
              
              return (
                <Card key={clientCase.$id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{clientCase.case_name}</span>
                      <div className="flex items-center gap-2">
                        {caseServes.length > 0 && (
                          <AffidavitGenerator
                            client={client}
                            serves={caseServes}
                            caseNumber={clientCase.case_number}
                            caseName={clientCase.case_name}
                            courtName={clientCase.court_name}
                            plaintiffPetitioner={clientCase.plaintiff_petitioner}
                            defendantRespondent={clientCase.defendant_respondent}
                            homeAddress={clientCase.home_address}
                            workAddress={clientCase.work_address}
                          />
                        )}
                        <EditCaseDialog
                          clientCase={clientCase}
                          onUpdate={updateCase}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCase(clientCase.$id)}
                          className="h-8 w-8 p-0 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Case Number:</strong> {clientCase.case_number}</p>
                      {clientCase.court_name && (
                        <p><strong>Court:</strong> {clientCase.court_name}</p>
                      )}
                      {clientCase.plaintiff_petitioner && (
                        <p><strong>Plaintiff/Petitioner:</strong> {clientCase.plaintiff_petitioner}</p>
                      )}
                      {clientCase.defendant_respondent && (
                        <p><strong>Defendant/Respondent:</strong> {clientCase.defendant_respondent}</p>
                      )}
                      {clientCase.notes && (
                        <p><strong>Notes:</strong> {clientCase.notes}</p>
                      )}
                      <p><strong>Service Attempts:</strong> {caseServes.length}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {clientCases.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No cases found for this client.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="serves" className="space-y-4">
          <h3 className="text-lg font-medium">Service History</h3>
          <ServeHistory 
            serves={mergedServes} 
            clients={[client]}
            onDelete={deleteServe}
            onEdit={updateServe}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <ClientDocuments clientId={client.id} clientName={client.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
