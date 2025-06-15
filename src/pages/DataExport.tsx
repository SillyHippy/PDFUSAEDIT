import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileSpreadsheet, ArrowLeft, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { appwrite } from "@/lib/appwrite";

const DataExport: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Fetch all serve attempts from Appwrite
      const serveAttempts = await appwrite.getServeAttempts();

      if (serveAttempts.length === 0) {
        toast({
          title: "No Data",
          description: "No serve attempts found in the database.",
          variant: "warning",
        });
        return;
      }

      // Convert serve attempts to CSV format
      const csvContent = convertToCSV(serveAttempts);

      // Create a downloadable file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `serve-data-all.csv`;
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `All data exported to ${fileName}.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting all data:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting all data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDateRange = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both a start and end date.",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Start date cannot be after the end date.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch serve attempts from Appwrite
      const serveAttempts = await appwrite.getServeAttempts();
      const filteredAttempts = serveAttempts.filter((attempt) => {
        const attemptDate = new Date(attempt.timestamp);
        return attemptDate >= startDate && attemptDate <= endDate;
      });

      if (filteredAttempts.length === 0) {
        toast({
          title: "No Data",
          description: "No serve attempts found for the selected date range.",
          variant: "warning",
        });
        return;
      }

      // Convert serve attempts to CSV format
      const csvContent = convertToCSV(filteredAttempts);

      // Create a downloadable file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `serve-data-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Data exported to ${fileName}.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((value) => `"${value}"`)
        .join(",")
    );
    return [headers, ...rows].join("\n");
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Data Export</h1>
        <p className="text-muted-foreground">
          Export your serve data to CSV for use in Excel or other spreadsheet applications.
        </p>
      </div>

      <Card className="neo-card">
        <CardHeader>
          <CardTitle>Export Serve Data</CardTitle>
          <CardDescription>
            Select a date range and export all serve data as CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Start Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">End Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={handleExportDateRange} 
            className="w-full" 
            disabled={isExporting || !startDate || !endDate}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Date Range
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card className="neo-card">
          <CardHeader>
            <CardTitle>Export All Serve Attempts</CardTitle>
            <CardDescription>
              Export all serve attempts from the database as a CSV file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExportAll} 
              className="w-full" 
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataExport;
