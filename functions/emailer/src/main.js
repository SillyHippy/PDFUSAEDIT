import nodemailer from 'nodemailer';
import process from "node:process";
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Processing request...');

  try {
    // Get payload from request
    const payload = req.payload
      ? (typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload)
      : (req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : null);

    if (!payload) {
      return res.json({ success: false, message: "No payload provided" });
    }

    log(req.bodyText);
    log(JSON.stringify(req.bodyJson));
    log(JSON.stringify(req.headers));

    const { to, subject, html, text, serveId, imageData, imageUrl } = payload;

    if (!to || !subject || (!html && !text)) {
      return res.json({ success: false, message: "Missing required fields (to, subject, and either html or text)" });
    }

    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);
    const databases = new Databases(appwriteClient);

    const emailData = {
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      attachments: []
    };

    // Always include info@justlegalsolutions.org
    if (!emailData.to.includes('info@justlegalsolutions.org')) {
      emailData.to.push('info@justlegalsolutions.org');
    }

    // Priority: imageUrl (new way) > serveId (fetch from db) > imageData (legacy base64)
    if (imageUrl && imageUrl.startsWith('http')) {
      log(`Downloading image from URL: ${imageUrl}`);
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          emailData.attachments.push({
            filename: 'serve_evidence.jpg',
            content: buffer
          });
          log(`Image downloaded and attached (${buffer.length} bytes)`);
        } else {
          error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
      } catch (downloadError) {
        error('Error downloading image from URL:', downloadError.message);
      }
    } else if (serveId) {
      // If serveId is provided, fetch the document to get image_url or image_data
      log(`Fetching serve attempt with ID: ${serveId}`);
      try {
        const serve = await databases.getDocument(
          process.env.APPWRITE_FUNCTION_DATABASE_ID,
          process.env.APPWRITE_FUNCTION_SERVE_ATTEMPTS_COLLECTION_ID,
          serveId
        );
        
        // Try image_url first (new way)
        if (serve.image_url && serve.image_url.startsWith('http')) {
          log(`Downloading image from serve document URL: ${serve.image_url}`);
          try {
            const response = await fetch(serve.image_url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              emailData.attachments.push({
                filename: 'serve_evidence.jpg',
                content: buffer
              });
              log(`Image downloaded from serve document and attached (${buffer.length} bytes)`);
            }
          } catch (downloadError) {
            error('Error downloading image from serve document URL:', downloadError.message);
          }
        }
        // Fallback to image_data (legacy base64)
        else if (serve.image_data) {
          log('Found image_data in serve attempt document (legacy)');
          let base64Content = serve.image_data;
          if (serve.image_data.includes('base64,')) {
            base64Content = serve.image_data.split('base64,')[1];
          }
          log(`Extracted base64 content length: ${base64Content.length}`);
          emailData.attachments.push({
            filename: 'serve_evidence.jpeg',
            content: base64Content,
            encoding: 'base64'
          });
          log('Image successfully attached from serve document (base64)');
        } else {
          log('No image_url or image_data found in serve attempt document');
        }
      } catch (fetchError) {
        error('Failed to fetch serve attempt document:', fetchError.message);
        return res.json({ success: false, message: 'Failed to fetch serve attempt document' }, 500);
      }
    } else if (imageData) {
      log("Using imageData provided in payload (legacy base64)");
      let base64Content = imageData;
      if (imageData.includes("base64,")) {
        base64Content = imageData.split("base64,")[1];
      }
      log(`Extracted base64 content length: ${base64Content.length}`);
      emailData.attachments.push({
        filename: 'serve_evidence.jpeg',
        content: base64Content,
        encoding: 'base64'
      });
      log('Image successfully attached using provided imageData');
    } else {
      log("No imageUrl, serveId, or imageData provided; no image will be attached");
    }

    // Read SMTP vars
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Send via Nodemailer
    const response = await transporter.sendMail(emailData);

    return res.json({ success: true, message: "Email sent successfully", data: response });

  } catch (err) {
    error(err);
    return res.json({ success: false, message: `Error: ${err.message}` });
  }
};
