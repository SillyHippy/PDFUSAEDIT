
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { FileText, Download } from 'lucide-react';
import { generateAffidavitPDF, AffidavitData } from '@/utils/pdfGenerator';
import { ServeAttemptData } from '@/types/ServeAttemptData';
import { ClientData } from '@/components/ClientForm';
import { useToast } from '@/hooks/use-toast';

interface AffidavitGeneratorProps {
  client: ClientData;
  serves: ServeAttemptData[];
  caseNumber?: string;
  caseName?: string;
  courtName?: string;
  plaintiffPetitioner?: string;
  defendantRespondent?: string;
  homeAddress?: string;
  workAddress?: string;
}

const AffidavitGenerator: React.FC<AffidavitGeneratorProps> = ({
  client,
  serves,
  caseNumber,
  caseName,
  courtName,
  plaintiffPetitioner,
  defendantRespondent,
  homeAddress,
  workAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const firstServe = serves[0];
  
  const displayServiceAddress = firstServe?.serviceAddress || firstServe?.address || '';
  
  // Use props directly from client_cases
  const displayCourtName = courtName || '';
  const displayPlaintiff = plaintiffPetitioner || '';
  const displayDefendant = defendantRespondent || '';
  const displayPersonBeingServed = caseName || '';
  const displayCaseNumber = caseNumber || '';

  console.log('AffidavitGenerator mapping data:', {
    courtName: displayCourtName,
    plaintiffPetitioner: displayPlaintiff,
    defendantRespondent: displayDefendant,
    personBeingServed: displayPersonBeingServed,
    serviceAddress: displayServiceAddress,
    caseNumber: displayCaseNumber,
    totalServes: serves.length,
    firstServeRaw: firstServe,
    propsReceived: {
      courtName,
      plaintiffPetitioner,
      defendantRespondent,
      caseName,
      caseNumber
    },
  });

  const handleGenerateAffidavit = async () => {
    setIsGenerating(true);
    
    try {
      const affidavitData: AffidavitData = {
        clientName: client.name,
        clientAddress: client.address,
        caseNumber: displayCaseNumber,
        caseName: displayPersonBeingServed,
        personEntityBeingServed: displayPersonBeingServed,
        courtName: displayCourtName,
        plaintiffPetitioner: displayPlaintiff,
        defendantRespondent: displayDefendant,
        serviceAddress: displayServiceAddress,
        serveAttempts: serves,
        homeAddress: homeAddress,
        workAddress: workAddress,
      };

      console.log('Generating affidavit with mapped data:', affidavitData);

      await generateAffidavitPDF(affidavitData);
      
      toast({
        title: "Affidavit Generated",
        description: "The affidavit PDF has been filled and downloaded successfully.",
        variant: "default"
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating affidavit:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate the affidavit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Affidavit of Service</DialogTitle>
          <DialogDescription>
            Review the details below. Clicking "Generate" will create and download a pre-filled affidavit PDF.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm space-y-2 border rounded-md p-4 bg-accent/20">
            <p><strong>Court:</strong> {displayCourtName || 'Not provided'}</p>
            <p><strong>Plaintiff/Petitioner:</strong> {displayPlaintiff || 'Not provided'}</p>
            <p><strong>Defendant/Respondent:</strong> {displayDefendant || 'Not provided'}</p>
            <p><strong>Person/Entity Being Served:</strong> {displayPersonBeingServed || 'Not provided'}</p>
            <p><strong>Service Address:</strong> {displayServiceAddress || 'Not provided'}</p>
            <p><strong>Case Number:</strong> {displayCaseNumber || 'Not provided'}</p>
            <p><strong>Total Attempts:</strong> {serves.length}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            All available information will be mapped to the correct fields in the PDF template.
          </p>

          <Button 
            onClick={handleGenerateAffidavit} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Affidavit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AffidavitGenerator;
