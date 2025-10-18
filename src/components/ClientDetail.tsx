
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  ArrowLeft,
  Edit
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import ClientCases from "./ClientCases";
import { ClientData } from "./ClientForm";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveDialog from "./ResponsiveDialog";
import { appwrite } from "@/lib/appwrite";

interface ClientDetailProps {
  client: ClientData;
  onUpdate: (client: ClientData) => void;
  onBack?: () => void;
}

export default function ClientDetail({ client, onUpdate, onBack }: ClientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [clientCases, setClientCases] = useState([]);
  const isMobile = useIsMobile();

  // Fetch client cases when component mounts
  useEffect(() => {
    const fetchClientCases = async () => {
      try {
        console.log("Fetching cases for client:", client.id);
        const cases = await appwrite.getClientCases(client.id);
        console.log("Retrieved client cases:", cases);
        setClientCases(cases);
      } catch (error) {
        console.error("Error fetching client cases:", error);
        setClientCases([]);
      }
    };

    if (client.id) {
      fetchClientCases();
    }
  }, [client.id]);

  const handleUpdateClient = (updatedClient: ClientData) => {
    onUpdate(updatedClient);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {onBack && (
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-2 md:mb-4 flex items-center"
          size={isMobile ? "sm" : "default"}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row justify-between items-center mb-4 gap-3'}`}>
          <TabsList className={`h-auto ${isMobile ? 'w-full' : ''}`}>
            <TabsTrigger value="details" className={isMobile ? 'flex-1' : ''}>Details</TabsTrigger>
            <TabsTrigger value="cases" className={isMobile ? 'flex-1' : ''}>Cases & Documents</TabsTrigger>
          </TabsList>
          
          {activeTab === "details" && (
            <div className="flex flex-wrap gap-2">
              {isMobile ? (
                <ResponsiveDialog
                  open={isEditing}
                  onOpenChange={setIsEditing}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </Button>
                  }
                  title="Edit Client"
                >
                  <ClientForm
                    onSubmit={handleUpdateClient}
                    initialData={client}
                  />
                </ResponsiveDialog>
              ) : (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Edit Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="h-[95vh] overflow-y-auto">
                    <ClientForm
                      onSubmit={handleUpdateClient}
                      initialData={client}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
        
        <TabsContent value="details" className="mt-0">
          <Card className="overflow-hidden">
            <CardHeader className={isMobile ? "px-4 py-4" : ""}>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Contact details and other information for this client
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "px-4 pb-6" : ""}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium break-words">{client.name}</div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="break-words">
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                        {client.email}
                      </a>
                    </div>
                    <div className="text-sm text-muted-foreground">Primary Email</div>
                  </div>
                </div>
                
                {client.additionalEmails && client.additionalEmails.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        {client.additionalEmails.map((email, index) => (
                          <div key={index} className="break-words">
                            <a href={`mailto:${email}`} className="text-primary hover:underline">
                              {email}
                            </a>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">Additional Emails</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div>
                      <a href={`tel:${client.phone}`} className="hover:underline">
                        {client.phone}
                      </a>
                    </div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="whitespace-pre-wrap break-words">{client.address}</div>
                    <div className="text-sm text-muted-foreground">Address</div>
                  </div>
                </div>
                
                {client.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="whitespace-pre-wrap break-words">{client.notes}</div>
                      <div className="text-sm text-muted-foreground">Notes</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cases" className="mt-0">
          <ClientCases 
            client={client} 
            onUpdate={() => onUpdate(client)}
            clientCases={clientCases}
            setClientCases={setClientCases}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
