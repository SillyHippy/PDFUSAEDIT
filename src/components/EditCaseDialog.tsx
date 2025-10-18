
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";

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

interface EditCaseDialogProps {
  clientCase: ClientCase;
  onUpdate: (caseData: any) => Promise<void>;
  isLoading?: boolean;
}

export default function EditCaseDialog({ clientCase, onUpdate, isLoading }: EditCaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [caseData, setCaseData] = useState({
    case_number: clientCase.case_number || "",
    case_name: clientCase.case_name || "",
    court_name: clientCase.court_name || "",
    plaintiff_petitioner: clientCase.plaintiff_petitioner || "",
    defendant_respondent: clientCase.defendant_respondent || "",
    notes: clientCase.notes || "",
    status: clientCase.status || "active",
    home_address: clientCase.home_address || "",
    work_address: clientCase.work_address || ""
  });

  const handleSave = async () => {
    try {
      await onUpdate({
        id: clientCase.$id,
        ...caseData
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating case:", error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="case_number">Case Number</Label>
              <Input
                id="case_number"
                value={caseData.case_number}
                onChange={(e) => setCaseData(prev => ({ ...prev, case_number: e.target.value }))}
                placeholder="Enter case number"
              />
            </div>
            <div>
              <Label htmlFor="case_name">Case Name</Label>
              <Input
                id="case_name"
                value={caseData.case_name}
                onChange={(e) => setCaseData(prev => ({ ...prev, case_name: e.target.value }))}
                placeholder="Enter case name"
              />
            </div>
            <div>
              <Label htmlFor="court_name">Court Name</Label>
              <Input
                id="court_name"
                value={caseData.court_name}
                onChange={(e) => setCaseData(prev => ({ ...prev, court_name: e.target.value }))}
                placeholder="Enter court name"
              />
            </div>
            <div>
              <Label htmlFor="plaintiff_petitioner">Plaintiff/Petitioner</Label>
              <Input
                id="plaintiff_petitioner"
                value={caseData.plaintiff_petitioner}
                onChange={(e) => setCaseData(prev => ({ ...prev, plaintiff_petitioner: e.target.value }))}
                placeholder="Enter plaintiff/petitioner"
              />
            </div>
            <div>
              <Label htmlFor="defendant_respondent">Defendant/Respondent</Label>
              <Input
                id="defendant_respondent"
                value={caseData.defendant_respondent}
                onChange={(e) => setCaseData(prev => ({ ...prev, defendant_respondent: e.target.value }))}
                placeholder="Enter defendant/respondent"
              />
            </div>
            <div>
              <Label htmlFor="home_address">Home Address</Label>
              <Input
                id="home_address"
                value={caseData.home_address}
                onChange={(e) => setCaseData(prev => ({ ...prev, home_address: e.target.value }))}
                placeholder="Enter home address"
              />
            </div>
            <div>
              <Label htmlFor="work_address">Work Address</Label>
              <Input
                id="work_address"
                value={caseData.work_address}
                onChange={(e) => setCaseData(prev => ({ ...prev, work_address: e.target.value }))}
                placeholder="Enter work address"
              />
            </div>
            <div>
              <Label htmlFor="status">Case Status</Label>
              <Select 
                value={caseData.status} 
                onValueChange={(value) => setCaseData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={caseData.notes}
                onChange={(e) => setCaseData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter case notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
