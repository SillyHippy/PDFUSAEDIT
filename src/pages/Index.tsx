
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { testEmailFunctionality } from "@/utils/testEmail";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import { isAppwriteConfigured } from "@/config/backendConfig";

export default function Index() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("serve-tracker-auth") === "authenticated";
    
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleSendTestMessage = async () => {
    if (sending) return;
    
    setSending(true);
    setResult(null);

    try {
      console.log("Starting message send attempt...");
      
      const result = await testEmailFunctionality();
      
      console.log("Message send result:", result);
      
      if (result.success) {
        setResult(result);
        toast({
          title: "Message sent successfully",
          description: "Test message was sent to business email",
          variant: "default"
        });
      } else {
        setResult({ error: result.message });
        toast({
          title: "Failed to send message",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error in message sending:", err);
      setResult({ error: errorMessage });
      toast({
        title: "Message sending error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">ServeTracker Messaging Test</CardTitle>
          <CardDescription>
            Test messaging functionality for your process serving notifications
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Test Configuration
            </label>
            <p className="text-xs text-gray-500 mt-1">
              The test will send a message to the business email (info@justlegalsolutions.org).
            </p>
          </div>
          
          {result && !result.error && (
            <div className="bg-green-50 p-3 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700 text-sm">Message sent successfully!</p>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-50 p-3 rounded-md flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error sending message</p>
                <p className="text-red-600 text-xs mt-1 break-words">{result.error}</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSendTestMessage}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" /> 
                Send Test Message
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
