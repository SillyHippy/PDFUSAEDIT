import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientData } from "./ClientForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CameraComponent from "./Camera";
import { embedGpsIntoImage } from "@/utils/gps";
import { formatCoordinates } from "@/utils/gps";
import { createServeEmailBody } from "@/utils/email";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Mail, Camera, AlertCircle, CheckCircle, Loader2, ExternalLink, Search, User } from "lucide-react";
import { getClientCases, getServeAttemptsCount } from "@/utils/appwriteStorage";
import { appwrite } from "@/lib/appwrite";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { debugImageData } from "@/utils/imageUtils";
import PhysicalDescriptionForm, { PhysicalDescriptionData } from "./PhysicalDescriptionForm";
import { ServeAttemptData } from "@/types/ServeAttemptData";

interface ServeAttemptProps {
  clients: ClientData[];
  onComplete: (data: ServeAttemptData) => void;
  previousAttempts?: number;
}

interface ClientCase {
  caseNumber: string;
  caseName?: string;
  homeAddress?: string;
  workAddress?: string;
  clientId?: string;
  clientName?: string;
  personEntityBeingServed?: string;
}

const serveAttemptSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  caseNumber: z.string().min(1, { message: "Please select a case" }),
  notes: z.string().optional(),
  status: z.enum(["completed", "failed"]),
  serviceAddress: z.string().optional(),
});

type ServeFormValues = z.infer<typeof serveAttemptSchema>;

const filterCases = (cases: ClientCase[], query: string) => {
  if (!query.trim()) return cases;

  const lowerQuery = query.toLowerCase();
  return cases.filter(
    (c) =>
      c.caseNumber?.toLowerCase().includes(lowerQuery) || 
      c.caseName?.toLowerCase().includes(lowerQuery) || 
      c.homeAddress?.toLowerCase().includes(lowerQuery) || 
      c.workAddress?.toLowerCase().includes(lowerQuery) || 
      c.clientName?.toLowerCase().includes(lowerQuery) ||
      c.personEntityBeingServed?.toLowerCase().includes(lowerQuery)
  );
};

const ServeAttempt: React.FC<ServeAttemptProps> = ({ 
  clients, 
  onComplete,
  previousAttempts = 0
}) => {
  const [step, setStep] = useState<"select" | "capture" | "confirm">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clientCases, setClientCases] = useState<ClientCase[]>([]);
  const [allCases, setAllCases] = useState<ClientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ClientCase | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [addressSearchTerm, setAddressSearchTerm] = useState("");
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [caseAttemptCount, setCaseAttemptCount] = useState(0);
  const [physicalDescription, setPhysicalDescription] = useState<PhysicalDescriptionData | undefined>();
  const [useHomeAddress, setUseHomeAddress] = useState(false);
  const [useWorkAddress, setUseWorkAddress] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string>("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const form = useForm<ServeFormValues>({
    resolver: zodResolver(serveAttemptSchema),
    defaultValues: {
      clientId: "",
      caseNumber: "",
      notes: "",
      status: "completed",
      serviceAddress: "",
    },
  });

  // Reverse geocode GPS coordinates to get address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // For now, return a formatted address using coordinates
      // In production, you would use a real geocoding service
      return `GPS Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  useEffect(() => {
    const fetchAllCases = async () => {
      setIsLoadingCases(true);
      try {
        const activeCases: ClientCase[] = [];

        for (const client of clients) {
          const clientCases = await appwrite.getClientCases(client.id);
          activeCases.push(
            ...clientCases.filter((caseItem) => caseItem.status !== "Closed").map((caseItem) => ({
              caseNumber: caseItem.case_number,
              caseName: caseItem.case_name,
              homeAddress: caseItem.home_address,
              workAddress: caseItem.work_address,
              clientId: client.id,
              clientName: client.name,
              personEntityBeingServed: caseItem.person_entity_being_served || caseItem.case_name,
            }))
          );
        }

        setAllCases(activeCases);
      } catch (error) {
        console.error("Error fetching all cases:", error);
        toast({
          title: "Error",
          description: "Failed to load cases",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCases(false);
      }
    };

    fetchAllCases();
  }, [clients]);

  useEffect(() => {
    if (selectedClient?.id) {
      const fetchClientCases = async () => {
        setIsLoadingCases(true);
        try {
          const clientCases = await appwrite.getClientCases(selectedClient.id);
          const activeCases = clientCases
            .filter((caseItem) => caseItem.status !== "Closed")
            .map((caseItem) => ({
              caseNumber: caseItem.case_number,
              caseName: caseItem.case_name,
              homeAddress: caseItem.home_address,
              workAddress: caseItem.work_address,
              clientId: selectedClient.id,
              clientName: selectedClient.name,
              personEntityBeingServed: caseItem.person_entity_being_served || caseItem.case_name,
            }));

          setClientCases(activeCases);
        } catch (error) {
          console.error("Error fetching client cases:", error);
          toast({
            title: "Error",
            description: "Failed to load client cases",
            variant: "destructive",
          });
        } finally {
          setIsLoadingCases(false);
        }
      };

      fetchClientCases();
    } else {
      setClientCases([]);
    }
  }, [selectedClient]);

  useEffect(() => {
    const updateAttemptCount = async () => {
      if (selectedClient?.id && selectedCase?.caseNumber) {
        const count = await getServeAttemptsCount(
          selectedClient.id, 
          selectedCase.caseNumber
        );
        setCaseAttemptCount(count);
      }
    };
    
    updateAttemptCount();
  }, [selectedClient, selectedCase]);

  const filteredCases = useMemo(() => {
    const casesToFilter = selectedClient ? clientCases : allCases;
    if (!addressSearchTerm.trim()) return casesToFilter;

    const lowerQuery = addressSearchTerm.toLowerCase();
    return casesToFilter.filter(
      (c) =>
        c.caseNumber?.toLowerCase().includes(lowerQuery) ||
        c.caseName?.toLowerCase().includes(lowerQuery) ||
        c.homeAddress?.toLowerCase().includes(lowerQuery) ||
        c.workAddress?.toLowerCase().includes(lowerQuery) ||
        c.clientName?.toLowerCase().includes(lowerQuery) ||
        c.personEntityBeingServed?.toLowerCase().includes(lowerQuery)
    );
  }, [addressSearchTerm, clientCases, allCases, selectedClient]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setSelectedClient(client || null);
    form.setValue("clientId", clientId);
    form.setValue("caseNumber", "");
    form.setValue("serviceAddress", "");
    setSelectedCase(null);
    setAddressSearchTerm("");
    setUseHomeAddress(false);
    setUseWorkAddress(false);
  };

  const handleCaseChange = async (caseNumber: string) => {
    const caseItem = clientCases.find(c => c.caseNumber === caseNumber) || null;
    setSelectedCase(caseItem);
    form.setValue("caseNumber", caseNumber);
    
    if (selectedClient?.id) {
      const count = await getServeAttemptsCount(selectedClient.id, caseNumber);
      setCaseAttemptCount(count);
    }
  };

  const handleAddressSelect = async (caseItem: ClientCase) => {
    if (caseItem.clientId && (!selectedClient || selectedClient.id !== caseItem.clientId)) {
      const client = clients.find(c => c.id === caseItem.clientId);
      if (client) {
        setSelectedClient(client);
        form.setValue("clientId", client.id);
      }
    }
    
    setSelectedCase(caseItem);
    form.setValue("caseNumber", caseItem.caseNumber);
    
    if (caseItem.clientId) {
      form.setValue("clientId", caseItem.clientId);
      
      const count = await getServeAttemptsCount(
        caseItem.clientId, 
        caseItem.caseNumber
      );
      setCaseAttemptCount(count);
    }
    
    setAddressSearchOpen(false);
  };

  const handleHomeAddressChange = (checked: boolean) => {
    setUseHomeAddress(checked);
    if (checked) {
      setUseWorkAddress(false);
      if (selectedCase?.homeAddress) {
        form.setValue("serviceAddress", selectedCase.homeAddress);
      }
    } else if (!useWorkAddress) {
      form.setValue("serviceAddress", "");
    }
  };

  const handleWorkAddressChange = (checked: boolean) => {
    setUseWorkAddress(checked);
    if (checked) {
      setUseHomeAddress(false);
      if (selectedCase?.workAddress) {
        form.setValue("serviceAddress", selectedCase.workAddress);
      }
    } else if (!useHomeAddress) {
      form.setValue("serviceAddress", "");
    }
  };

  const handleCameraCapture = async (imageData: string, coords: GeolocationCoordinates) => {
    setCapturedImage(imageData);
    setLocation(coords);
    setStep("confirm");
  };

  const handleAddressClick = (address: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
    console.log("Opening address location in Google Maps:", address);
  };

  const handlePhysicalDescriptionSave = (data: PhysicalDescriptionData) => {
    setPhysicalDescription(data);
  };

  const formatPhysicalDescription = (desc: PhysicalDescriptionData): string => {
    const parts: string[] = [];
    if (desc.age) parts.push(`Age: ${desc.age}`);
    if (desc.sex) parts.push(`Sex: ${desc.sex}`);
    if (desc.race) parts.push(`Race: ${desc.race}`);
    if (desc.height) parts.push(`Height: ${desc.height}`);
    if (desc.weight) parts.push(`Weight: ${desc.weight}`);
    if (desc.hair) parts.push(`Hair: ${desc.hair}`);
    if (desc.beard) parts.push(`Beard: ${desc.beard}`);
    if (desc.glasses) parts.push(`Glasses: ${desc.glasses}`);
    return parts.join(', ');
  };

  const handleSubmit = async (data: ServeFormValues) => {
    if (!capturedImage || !location || !selectedClient || !selectedCase) {
      console.error("Missing required information. Please try again.");
      toast({
        title: "Missing Information",
        description: "Required information is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const imageWithGPS = embedGpsIntoImage(capturedImage, location);

      let finalNotes = data.notes || "";
      if (physicalDescription && data.status === "completed") {
        const descText = formatPhysicalDescription(physicalDescription);
        if (descText) {
          finalNotes = finalNotes ? `${finalNotes}\n\nPhysical Description: ${descText}` : `Physical Description: ${descText}`;
        }
      }

      // Map to database field names (snake_case)
      const serveData: ServeAttemptData = {
        client_id: selectedClient.id,
        clientId: selectedClient.id, // Keep alias for compatibility
        clientName: selectedClient.name,
        clientEmail: selectedClient.email || "",
        case_number: selectedCase.caseNumber,
        caseNumber: selectedCase.caseNumber, // Keep alias for compatibility
        case_name: selectedCase.caseName || "Unknown Case",
        caseName: selectedCase.caseName || "Unknown Case", // Keep alias for compatibility
        personEntityBeingServed: selectedCase.personEntityBeingServed || selectedCase.caseName || "",
        imageData: imageWithGPS,
        coordinates: `${location.latitude},${location.longitude}`,
        address: selectedCase.homeAddress || selectedCase.workAddress || selectedClient.address || "No address available",
        serviceAddress: data.serviceAddress,
        notes: finalNotes,
        timestamp: new Date(),
        status: data.status,
        attemptNumber: caseAttemptCount + 1,
        physicalDescription,
      };

      console.log("Submitting serve attempt data to Appwrite:", serveData);

      // Save to the database
      const savedServe = await appwrite.createServeAttempt(serveData);
      console.log("Serve attempt saved successfully:", savedServe);

      toast({
        title: "Serve recorded",
        description: "Service attempt has been saved successfully.",
        variant: "success",
      });

      form.reset();
      setCapturedImage(null);
      setLocation(null);
      setSelectedClient(null);
      setSelectedCase(null);
      setPhysicalDescription(undefined);
      setUseHomeAddress(false);
      setUseWorkAddress(false);
      setGpsAddress("");
      setStep("select");
    } catch (error) {
      console.error("Error saving serve attempt:", error);
      toast({
        title: "Error",
        description: "Failed to save serve attempt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getMapLink = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const isCaseSelected = !!form.watch("caseNumber");
  const isSuccessfulServe = form.watch("status") === "completed";

  return (
    <div className="animate-slide-in w-full max-w-md mx-auto">
      {step === "select" && (
        <Card className="neo-card mb-6">
          <CardHeader>
            <CardTitle>New Serve Attempt</CardTitle>
            <CardDescription>
              Select a client and case to begin
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form className="space-y-4">
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Search by address across all cases</p>
                  <Popover open={addressSearchOpen} onOpenChange={setAddressSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={addressSearchOpen}
                        className="w-full justify-between text-left relative"
                      >
                        {addressSearchTerm || "Search addresses, cases, or clients..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={`${isMobile ? 'w-screen max-w-[calc(100vw-2rem)]' : 'w-[300px]'} p-0`}>
                      <Command>
                        <CommandInput
                          placeholder="Search address, case, or client..."
                          value={addressSearchTerm}
                          onValueChange={setAddressSearchTerm}
                        />
                        <CommandEmpty>
                          {isLoadingCases ? "Loading cases..." : "No cases found."}
                        </CommandEmpty>
                        <CommandList className="max-h-[300px]">
                          <CommandGroup heading="Cases">
                            {filteredCases.map((caseItem) => (
                              <CommandItem
                                key={`${caseItem.clientId}-${caseItem.caseNumber}`}
                                value={`${caseItem.caseNumber}-${caseItem.homeAddress}-${caseItem.workAddress}`}
                                onSelect={() => handleAddressSelect(caseItem)}
                              >
                                <div className="flex flex-col w-full">
                                  <span className="font-medium">
                                    {caseItem.personEntityBeingServed || caseItem.caseName || caseItem.caseNumber}
                                  </span>
                                  {caseItem.clientName && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      Client: {caseItem.clientName}
                                    </span>
                                  )}
                                  {caseItem.homeAddress && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      Home: {caseItem.homeAddress}
                                    </span>
                                  )}
                                  {caseItem.workAddress && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      Work: {caseItem.workAddress}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">
                      OR SELECT CLIENT DIRECTLY
                    </span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleClientChange(value);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id || ""}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedClient && (
                  <>
                    <div className="space-y-2 p-3 rounded-md bg-accent/50">
                      <p className="text-sm font-medium">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> 
                        <a 
                          href={getMapLink(selectedClient.address)}
                          className="hover:underline text-primary flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleAddressClick(selectedClient.address, e)}
                        >
                          {selectedClient.address}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> 
                        {selectedClient.email}
                      </p>
                    </div>
                    {clientCases.length > 0 ? (
                      <>
                        <FormField
                          control={form.control}
                          name="caseNumber"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Case</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleCaseChange(value);
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a case" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clientCases.map(c => (
                                      <SelectItem key={c.caseNumber} value={c.caseNumber}>
                                        {c.caseNumber} - {c.personEntityBeingServed || c.caseName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="text-sm text-center p-3 bg-accent/30 rounded-md">
                        <p className="text-muted-foreground">No cases found for this client.</p>
                        <p className="text-xs text-muted-foreground mt-1">Please select a different client or add cases first.</p>
                      </div>
                    )}

                    {selectedCase && (selectedCase.homeAddress || selectedCase.workAddress) && (
                      <div className="space-y-2 p-3 rounded-md bg-accent/20">
                        {selectedCase.homeAddress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Home Address:</p>
                            <a 
                              href={getMapLink(selectedCase.homeAddress)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleAddressClick(selectedCase.homeAddress!, e)}
                            >
                              <MapPin className="h-3 w-3" />
                              {selectedCase.homeAddress}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {selectedCase.workAddress && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Work Address:</p>
                            <a 
                              href={getMapLink(selectedCase.workAddress)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleAddressClick(selectedCase.workAddress!, e)}
                            >
                              <MapPin className="h-3 w-3" />
                              {selectedCase.workAddress}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => setStep("capture")}
              disabled={!isCaseSelected}
            >
              <Camera className="w-4 h-4 mr-2" />
              Continue to Camera
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Capture Photo</h3>
            <Button 
              variant="ghost"
              onClick={() => setStep("select")}
              size="sm"
            >
              Back
            </Button>
          </div>
          
          <CameraComponent onCapture={handleCameraCapture} />
          <p className="text-sm text-muted-foreground text-center">
            The photo will automatically include GPS location data
          </p>
        </div>
      )}

      {step === "confirm" && capturedImage && location && (
        <Card className="neo-card">
          <CardHeader>
            <CardTitle>Complete Serve Attempt</CardTitle>
            <CardDescription>
              Submit details to complete the serve attempt
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {selectedClient && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Client: {selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground">Address: {selectedClient.address}</p>
                    {selectedCase && selectedCase.personEntityBeingServed && (
                      <>
                        <p className="text-xs text-muted-foreground">Person/Entity: {selectedCase.personEntityBeingServed}</p>
                        <p className="text-xs bg-primary/10 text-primary mt-1 p-1 px-2 rounded-full inline-block">
                          Attempt #{caseAttemptCount + 1}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="rounded-md overflow-hidden mb-4 border">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full aspect-[4/3] object-cover" 
                  />
                </div>
                
                <div className="p-3 rounded-md bg-accent/50 text-xs space-y-1 mb-4">
                  <div className="font-medium">Location Data:</div>
                  <div className="text-muted-foreground">
                    GPS: {formatCoordinates(location.latitude, location.longitude)}
                  </div>
                  <div className="text-muted-foreground">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="serviceAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Address (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input 
                            placeholder="Enter the actual service address (optional)"
                            {...field}
                          />
                          <div className="flex flex-col gap-2">
                            {selectedCase?.homeAddress && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="homeAddress"
                                  checked={useHomeAddress}
                                  onCheckedChange={handleHomeAddressChange}
                                />
                                <Label htmlFor="homeAddress" className="text-xs cursor-pointer">
                                  Use Home Address: {selectedCase.homeAddress}
                                </Label>
                              </div>
                            )}
                            {selectedCase?.workAddress && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="workAddress"
                                  checked={useWorkAddress}
                                  onCheckedChange={handleWorkAddressChange}
                                />
                                <Label htmlFor="workAddress" className="text-xs cursor-pointer">
                                  Use Work Address: {selectedCase.workAddress}
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">
                              <div className="flex items-center">
                                <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500" />
                                Successful Serve
                              </div>
                            </SelectItem>
                            <SelectItem value="failed">
                              <div className="flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                Failed Attempt
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isSuccessfulServe && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Physical Description (Optional)</Label>
                    <PhysicalDescriptionForm 
                      onSave={handlePhysicalDescriptionSave}
                      initialData={physicalDescription}
                    >
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full justify-start"
                        size="sm"
                      >
                        <User className="w-4 h-4 mr-2" />
                        {physicalDescription && Object.values(physicalDescription).some(v => v && v.trim()) 
                          ? "Edit Physical Description" 
                          : "Add Physical Description"
                        }
                      </Button>
                    </PhysicalDescriptionForm>
                    {physicalDescription && Object.values(physicalDescription).some(v => v && v.trim()) && (
                      <div className="text-xs text-muted-foreground p-2 bg-accent/30 rounded">
                        {formatPhysicalDescription(physicalDescription)}
                      </div>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about this serve attempt..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep("capture")}
                    className="flex-1"
                    disabled={isSending}
                  >
                    Retake Photo
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : "Complete & Send"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServeAttempt;
