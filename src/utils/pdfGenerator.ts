import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { ServeAttemptData } from '@/types/ServeAttemptData';

// Use local template file instead of GitHub URL
const affidavitTemplateUrl = '/Templates/NAPPS-Affidavit%20form%20filled.pdf';

export interface AffidavitData {
  clientName: string;
  clientAddress: string;
  caseNumber: string;
  caseName?: string;
  personEntityBeingServed?: string;
  serveAttempts: ServeAttemptData[];
  courtName?: string;
  plaintiffPetitioner?: string;
  defendantRespondent?: string;
  serviceAddress?: string;
  homeAddress?: string;
  workAddress?: string;
}

export const generateAffidavitPDF = async (data: AffidavitData): Promise<void> => {
  try {
    console.log('Starting PDF generation with data:', data);
    console.log(`Attempting to load template from local URL: ${affidavitTemplateUrl}`);
    
    let pdfDoc: PDFDocument;

    try {
      const response = await fetch(affidavitTemplateUrl, { 
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
      }

      const existingPdfBytes = await response.arrayBuffer();
      if (existingPdfBytes.byteLength === 0) {
        throw new Error('Template file is empty.');
      }
      
      pdfDoc = await PDFDocument.load(existingPdfBytes);
      console.log(`✅ Successfully loaded PDF template from: ${affidavitTemplateUrl}`);

    } catch (error) {
      console.error('❌ Failed to load or parse PDF template:', error);
      let errorMessage = 'Failed to load the affidavit template.\n\n';
      errorMessage += `URL: ${affidavitTemplateUrl}\n`;
      errorMessage += 'Please ensure the template file is available in the public/Templates folder.\n\n';
      if (error instanceof Error) {
        errorMessage += `Details: ${error.message}`;
      }
      throw new Error(errorMessage);
    }
    
    // Get the form from the PDF
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log('Available form fields:', fields.map(field => field.getName()));
    
    // Helper function to safely fill text fields
    const fillTextField = (fieldName: string, value: string | undefined) => {
      if (!value || value.trim() === '' || value === 'Not specified' || value === 'N/A') {
        return false;
      }
      
      try {
        const field = form.getTextField(fieldName);
        if (field) {
          field.setText(value);
          console.log(`Filled ${fieldName}: ${value}`);
          return true;
        }
      } catch (error) {
        console.log(`Field ${fieldName} not found or not a text field`);
      }
      return false;
    };

    // Helper function to check checkboxes
    const checkCheckbox = (fieldName: string) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (field) {
          field.check();
          console.log(`Checked: ${fieldName}`);
          return true;
        }
      } catch (error) {
        console.log(`Checkbox ${fieldName} not found`);
      }
      return false;
    };

    // Fill basic case information
    fillTextField('Case Number', data.caseNumber);
    fillTextField('Name of Court', data.courtName);
    fillTextField('Plaintiff/Petitioner', data.plaintiffPetitioner);
    fillTextField('Defendant/Respondent', data.defendantRespondent);
    
    // Fill person being served
    const personBeingServed = data.personEntityBeingServed || data.caseName;
    fillTextField('Name of Person/Entity Being Served', personBeingServed);
    fillTextField('NAME OF PERSON / ENTITY BEING SERVED', personBeingServed);
    fillTextField('NAME OF PERSON/ENTITY BEING SERVED', personBeingServed);
    
    // Determine service address
    const serviceAddress = data.serviceAddress || data.serveAttempts[0]?.serviceAddress || data.serveAttempts[0]?.address;
    
    console.log('Service address candidates:', {
      fromDataProp: data.serviceAddress,
      fromServeAttempt_serviceAddress: data.serveAttempts[0]?.serviceAddress,
      fromServeAttempt_address: data.serveAttempts[0]?.address,
      finalServiceAddress: serviceAddress
    });
    
    if (serviceAddress && serviceAddress.trim() && serviceAddress !== 'Not specified') {
      fillTextField('ADDRESS', serviceAddress);
      
      // Parse city/state from address
      const addressParts = serviceAddress.split(',');
      let cityState = '';
      if (addressParts.length >= 2) {
        const lastPart = addressParts[addressParts.length - 1].trim();
        const cityPart = addressParts[addressParts.length - 2].trim();
        cityState = `${cityPart}, ${lastPart}`;
        fillTextField('CITY / STATE', cityState);
      }
      
      // Determine if residence or business service
      let isBusinessService = false;
      if (data.workAddress && serviceAddress.toLowerCase().includes(data.workAddress.toLowerCase().trim())) {
          isBusinessService = true;
      } else if (data.homeAddress && serviceAddress.toLowerCase().includes(data.homeAddress.toLowerCase().trim())) {
          isBusinessService = false;
      } else {
          // Fallback to keyword matching if addresses don't match
          isBusinessService = ['work', 'office', 'business', 'corp', 'llc', 'inc'].some(keyword => serviceAddress.toLowerCase().includes(keyword));
      }
      
      if (isBusinessService) {
        checkCheckbox('business checkbox');
        checkCheckbox('Business');
        checkCheckbox('At business');
        fillTextField('Business address', serviceAddress);
        if (cityState) fillTextField('Business city and state', cityState);
      } else {
        checkCheckbox('Residence Checkbox');
        checkCheckbox('Residence');
        checkCheckbox('At residence');
        fillTextField('Residence address', serviceAddress);
        if (cityState) fillTextField('Residence City and state', cityState);
      }
    }
    
    // Fill service attempt information
    if (data.serveAttempts && data.serveAttempts.length > 0) {
      // Sort attempts by timestamp
      const sortedAttempts = [...data.serveAttempts].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 
                      a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 
                      b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });

      // Get the most recent successful serve for main service details
      const successfulServe = sortedAttempts.find(attempt => attempt.status === 'completed') || sortedAttempts[sortedAttempts.length - 1];
      
      const serveTimestamp = successfulServe?.timestamp || successfulServe?.created_at;
      if (serveTimestamp) {
        const date = new Date(serveTimestamp);
        
        // Fill main service date and time
        fillTextField('Service Date', date.toLocaleDateString());
        fillTextField('DATE', date.toLocaleDateString());
        fillTextField('On', date.toLocaleDateString());
        
        fillTextField('Service Time', date.toLocaleTimeString());
        fillTextField('TIME', date.toLocaleTimeString());
        fillTextField('AT', date.toLocaleTimeString());
      }

      // Fill individual service attempts (up to 5)
      sortedAttempts.slice(0, 5).forEach((attempt, index) => {
        const attemptTimestamp = attempt.timestamp || attempt.created_at;
        if (attemptTimestamp) {
          const date = new Date(attemptTimestamp);
          const attemptNum = index + 1;
          
          fillTextField(`Service attempt ${attemptNum} Date`, date.toLocaleDateString());
          fillTextField(`Service attempt ${attemptNum} date`, date.toLocaleDateString());
          fillTextField(`${attemptNum} DATE`, date.toLocaleDateString());
          
          fillTextField(`Service attempt ${attemptNum} time`, date.toLocaleTimeString());
          fillTextField(`Service attempt ${attemptNum} Time`, date.toLocaleTimeString());
          fillTextField(`${attemptNum} TIME`, date.toLocaleTimeString());
        }
      });

      // Compile all notes including physical descriptions - use database field names
      const allNotes = sortedAttempts
        .filter(attempt => {
          const notes = attempt.notes || attempt.description;
          return notes && notes.trim();
        })
        .map((attempt, index) => {
          const attemptLabel = sortedAttempts.length > 1 ? `Attempt ${index + 1}: ` : '';
          const notes = attempt.notes || attempt.description || '';
          return `${attemptLabel}${notes}`;
        })
        .join('\n\n');

      if (allNotes) {
        fillTextField('Description', allNotes);
        fillTextField('service_description', allNotes);
        fillTextField('Description::', allNotes);
      }
    }
    
    // Fill affidavit completion date
    fillTextField('affidavit_date', new Date().toLocaleDateString());
    fillTextField('date_of_affidavit', new Date().toLocaleDateString());
    fillTextField('sworn_date', new Date().toLocaleDateString());
    
    console.log('PDF form filling completed');
    
    // Save and download the PDF
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await pdfDoc.save();
    } catch (saveError) {
      console.error('Error saving PDF document with pdf-lib:', saveError);
      throw new Error('Failed to save the PDF document. There might be an issue with the data provided.');
    }
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Affidavit_${data.caseNumber || 'Service'}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up the DOM and revoke the URL after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('PDF download resources released');
    }, 100);
    
    console.log('✅ PDF download initiated successfully');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};
