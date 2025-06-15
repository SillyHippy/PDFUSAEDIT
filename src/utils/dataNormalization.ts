import { ServeAttemptData } from "@/types/ServeAttemptData";
import { ClientData } from "@/components/ClientForm";

/**
 * Normalize serve data from any format to the standard ServeAttemptData format
 * This handles conversion between snake_case, camelCase, and Appwrite document formats
 */
export function normalizeServeData(serve: any): ServeAttemptData | null {
  if (!serve) return null;

  // Use $id if available; otherwise use id
  const id = serve.$id || serve.id;
  if (!id) {
    // Instead of logging an error, warn and skip this record
    console.warn("Skipping serve data without an ID:", serve);
    return null;
  }

  return {
    id,
    // Database fields (snake_case)
    client_id: serve.client_id || serve.clientId || "unknown",
    case_name: serve.case_name || serve.caseName || "Unknown Case",
    case_number: serve.case_number || serve.caseNumber || "Unknown",
    service_address: serve.service_address || serve.serviceAddress || serve.address,
    notes: serve.notes || "",
    status: serve.status || "unknown",
    timestamp: serve.timestamp ? new Date(serve.timestamp) : new Date(),
    attempt_number: serve.attempt_number || serve.attemptNumber || 1,
    image_data: serve.image_data || serve.imageData || null,
    coordinates: serve.coordinates || null,
    description: serve.description || "",
    created_at: serve.created_at || serve.timestamp || new Date().toISOString(),
    updated_at: serve.updated_at || new Date().toISOString(),
    
    // Fields from client_cases that might be merged
    court_name: serve.court_name || "",
    plaintiff_petitioner: serve.plaintiff_petitioner || "",
    defendant_respondent: serve.defendant_respondent || "",
    home_address: serve.home_address || "",
    work_address: serve.work_address || "",
    
    // Aliases for compatibility (camelCase)
    clientId: serve.clientId || serve.client_id || "unknown",
    clientName: serve.clientName || serve.client_name || "Unknown Client",
    clientEmail: serve.clientEmail || serve.client_email || "",
    caseNumber: serve.caseNumber || serve.case_number || "Unknown",
    caseName: serve.caseName || serve.case_name || "Unknown Case",
    serviceAddress: serve.serviceAddress || serve.service_address || serve.address,
    address: serve.address || serve.service_address || serve.home_address,
    attemptNumber: serve.attemptNumber || serve.attempt_number || 1,
    imageData: serve.imageData || serve.image_data || null,
    personEntityBeingServed: serve.personEntityBeingServed || serve.person_entity_being_served || "",
    physicalDescription: serve.physicalDescription || serve.physical_description,
  };
}

/**
 * Normalize an array of serve data objects
 */
export function normalizeServeDataArray(serves: any[]) {
  return serves
    .map((serve) => normalizeServeData(serve))
    .filter((serve) => serve !== null);
}

/**
 * Adds client names to serve attempts based on clientId
 */
export function addClientNamesToServes(serves: ServeAttemptData[], clients: ClientData[]): ServeAttemptData[] {
  if (!serves || !clients || !Array.isArray(serves) || !Array.isArray(clients)) {
    return serves || [];
  }

  return serves.map(serve => {
    // Skip if serve already has a client name
    if (serve.clientName && serve.clientName !== "Unknown Client") {
      return serve;
    }

    // Find matching client - check both id and $id properties
    const client = clients.find(c => {
      // Handle both ClientData and raw Appwrite document formats
      const clientId = c.id || (c as any).$id;
      return clientId === serve.clientId;
    });
    
    // Return updated serve with client name if found
    if (client) {
      return {
        ...serve,
        clientName: client.name
      };
    }
    
    return serve;
  });
}

/**
 * Merges serve attempts with their corresponding case data.
 * @param serves - The array of serve attempts.
 * @param cases - The array of client cases.
 * @returns A new array of serve attempts with case data merged in.
 */
export function mergeServeAndCaseData(serves: ServeAttemptData[], cases: any[]): ServeAttemptData[] {
  if (!serves || !cases || !Array.isArray(serves) || !Array.isArray(cases) || cases.length === 0) {
    return serves || [];
  }

  const caseMap = new Map<string, any>();
  cases.forEach(c => {
    if (c.client_id && c.case_number) {
      const key = `${c.client_id}-${c.case_number}`;
      caseMap.set(key, c);
    }
  });

  return serves.map(serve => {
    if (!serve.clientId || !serve.caseNumber) {
      return serve;
    }
    const key = `${serve.clientId}-${serve.caseNumber}`;
    const matchingCase = caseMap.get(key);

    if (matchingCase) {
      return {
        ...serve,
        court_name: matchingCase.court_name,
        plaintiff_petitioner: matchingCase.plaintiff_petitioner,
        defendant_respondent: matchingCase.defendant_respondent,
        home_address: matchingCase.home_address,
        work_address: matchingCase.work_address,
      };
    }
    return serve;
  });
}
