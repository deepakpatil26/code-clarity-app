"use client";

import { useState } from "react";
import { suggestCodeImprovements } from "@/ai/flows/suggest-code-improvements";
import type { SuggestCodeImprovementsOutput } from "@/ai/schemas/code-analysis";
import { generateReport } from "@/ai/flows/generate-report-flow";
import {
  Bot,
  Code,
  Download,
  FileCheck2,
  Languages,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useAuth } from "@/hooks/use-auth";

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

const exampleCode = `function factorial(n) {
  if (n < 0) {
    return "Number must be non-negative";
  }
  if (n === 0) {
    return 1;
  }
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}`;

export function CodeAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState(exampleCode);
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState<SuggestCodeImprovementsOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to analyze code.",
      });
      return;
    }
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Code input cannot be empty.",
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await suggestCodeImprovements({ code, language });
      setResult(analysisResult);
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setError(
        `Failed to analyze code. Please try again later. Error: ${errorMessage}`
      );
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: `An error occurred while analyzing the code.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!result) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No analysis results to export.",
      });
      return;
    }
    setIsExporting(true);
    try {
      const { html } = await generateReport({
        code,
        language,
        suggestions: result.suggestions,
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "code-analysis-report.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your report has been downloaded as an HTML file.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while generating the report.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 xl:p-8">
      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Code Input</CardTitle>
                <CardDescription>
                  Paste your code below and select the language.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="grid w-full gap-1.5">
              <Label
                htmlFor="language-select"
                className="flex items-center gap-2"
              >
                <Languages className="w-4 h-4" /> Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                  id="language-select"
                  className="w-full lg:w-[240px]"
                >
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5 flex-1 flex flex-col">
              <Label htmlFor="code-input">Code</Label>
              <Textarea
                id="code-input"
                placeholder="Enter your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 font-mono text-sm resize-none min-h-[400px]"
              />
            </div>
            <Button
              onClick={handleAnalysis}
              disabled={isLoading || !user}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Analyze Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col sticky top-20">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileCheck2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Analysis Report</CardTitle>
                <CardDescription>
                  AI-powered suggestions to improve your code.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!result || isLoading || isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!isLoading &&
              !error &&
              result &&
              (result.suggestions.length > 0 ? (
                <ul className="space-y-4">
                  {result.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-md bg-secondary/50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary flex-shrink-0">
                        <Bot className="h-5 w-5" />
                      </span>
                      <p className="text-sm text-secondary-foreground pt-1.5">
                        {suggestion}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>No suggestions available. The code looks great!</p>
                </div>
              ))}
            {!isLoading && !error && !result && (
              <div className="text-center text-muted-foreground py-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                <FileCheck2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="font-medium">Ready for analysis</p>
                <p className="text-sm">
                  Your code review results will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
