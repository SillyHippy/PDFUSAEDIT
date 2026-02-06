
export interface ServeAttemptData {
  id?: string;
  client_id: string;
  case_name: string;
  case_number: string;
  description?: string;
  status: string;
  service_address?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  
  // Additional fields from ServeAttempt component
  clientId?: string; // alias for client_id
  clientName?: string;
  clientEmail?: string;
  caseName?: string; // alias for case_name
  caseNumber?: string; // alias for case_number
  serviceAddress?: string; // alias for service_address
  address?: string; // generic geocoded address field
  timestamp?: string | Date;
  coordinates?: string | { latitude: number; longitude: number };
  imageData?: string; // Deprecated: use image_url instead
  image_data?: string; // Deprecated: use image_url instead
  image_url?: string; // Public URL to full image in Appwrite Storage
  imageUrl?: string; // alias for image_url
  image_file_id?: string; // File ID for full image in Appwrite Storage
  imageFileId?: string; // alias for image_file_id
  thumbnailUrl?: string; // Public URL to thumbnail in Appwrite Storage
  thumbnailFileId?: string; // File ID in Appwrite Storage for deletion
  attemptNumber?: number;
  attempt_number?: number;
  personEntityBeingServed?: string;
  physicalDescription?: any; // PhysicalDescriptionData type

  // Fields from client_cases that might be merged
  court_name?: string;
  plaintiff_petitioner?: string;
  defendant_respondent?: string;
  home_address?: string;
  work_address?: string;
}
