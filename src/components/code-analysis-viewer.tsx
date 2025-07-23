"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  UploadCloud,
  Download,
  Volume2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suggestCodeImprovements } from "@/ai/flows/suggest-code-improvements";
import { generateReport } from "@/ai/flows/generate-report-flow";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";

type Suggestion = {
  lineNumber: number;
  message: string;
  type?: "quality" | "security" | "performance";
  severity?: "low" | "medium" | "high";
  originalSuggestion: string;
};

type FileAnalysis = {
  file: File;
  path: string;
  content: string;
  language: string;
  suggestions: Suggestion[];
  loading: boolean;
  error?: string;
  isExporting?: boolean;
  isGeneratingAudio?: boolean;
  audioSrc?: string | null;
};

export function CodeAnalysisViewer() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileAnalysis[] = Array.from(selectedFiles).map((file) => ({
      file: file,
      path: file.name,
      content: "",
      language: getLanguageFromFilename(file.name),
      suggestions: [],
      loading: true, // Start in loading state
      error: undefined,
    }));

    // Check for duplicates
    const nonDuplicateFiles = newFiles.filter(
      (nf) => !files.some((f) => f.path === nf.path)
    );
    const allFiles = [...files, ...nonDuplicateFiles];
    setFiles(allFiles);

    if (nonDuplicateFiles.length === 0 && selectedFiles.length > 0) {
      toast({
        title: "File already open",
        description: `The file "${selectedFiles[0].name}" is already in the editor.`,
      });
      // Switch to the existing tab
      setActiveTab(selectedFiles[0].name);
      return;
    }

    if (allFiles.length > 0 && !activeTab) {
      setActiveTab(allFiles[0].path);
    } else if (nonDuplicateFiles.length > 0) {
      setActiveTab(nonDuplicateFiles[0].path);
    }

    for (const file of nonDuplicateFiles) {
      await loadAndAnalyzeFile(file);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  const loadAndAnalyzeFile = async (file: FileAnalysis) => {
    try {
      // Ensure we are in a loading state before starting
      updateFileState(file.path, { loading: true, error: undefined });

      const content = await readFileContent(file.file);

      updateFileState(file.path, { content });

      const result = await suggestCodeImprovements({
        code: content,
        language: file.language,
      });

      const suggestions: Suggestion[] = result.suggestions.map(
        (suggestionStr) => {
          const lineMatch = suggestionStr.match(/\[line (\d+)\]/);
          const typeMatch = suggestionStr.match(
            /\[(quality|security|performance)(?:\/(low|medium|high))?\]/i
          );

          const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : 0;
          const type =
            (typeMatch?.[1]?.toLowerCase() as Suggestion["type"]) || "quality";
          const severity =
            (typeMatch?.[2]?.toLowerCase() as Suggestion["severity"]) ||
            "medium";

          const message = suggestionStr
            .replace(/\[line \d+\]\s*/, "")
            .replace(
              /\[(quality|security|performance)(?:\/(low|medium|high))?\]\s*/i,
              ""
            )
            .trim();

          return {
            lineNumber,
            message,
            type,
            severity,
            originalSuggestion: suggestionStr,
          };
        }
      );

      updateFileState(file.path, { suggestions, loading: false });
    } catch (error) {
      console.error(`Error analyzing ${file.path}:`, error);
      updateFileState(file.path, {
        error: "Failed to analyze file",
        loading: false,
      });

      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: `Failed to analyze ${file.path}. Please try again.`,
      });
    }
  };

  const handleExport = async (file: FileAnalysis) => {
    if (!file.suggestions || file.suggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "No analysis results to export.",
      });
      return;
    }
    updateFileState(file.path, { isExporting: true });
    try {
      const suggestionsAsStrings = file.suggestions.map(
        (s) => s.originalSuggestion
      );

      const { html } = await generateReport({
        code: file.content,
        language: file.language,
        suggestions: suggestionsAsStrings,
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.path}-analysis-report.html`;
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
      updateFileState(file.path, { isExporting: false });
    }
  };

  const handleListen = async (file: FileAnalysis) => {
    if (!file.suggestions || file.suggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to read",
        description: "There are no suggestions to turn into audio.",
      });
      return;
    }
    updateFileState(file.path, { isGeneratingAudio: true, audioSrc: null });
    try {
      const suggestionsText = file.suggestions
        .map((s) => s.originalSuggestion)
        .join(". ");
      const audioResult = await textToSpeech({
        text: `Analysis for file: ${file.path}. ${suggestionsText}`,
      });
      updateFileState(file.path, { audioSrc: audioResult.audio });
    } catch (error) {
      console.error("Failed to generate audio:", error);
      toast({
        variant: "destructive",
        title: "Audio Generation Failed",
        description: "An unexpected error occurred while generating the audio.",
      });
    } finally {
      updateFileState(file.path, { isGeneratingAudio: false });
    }
  };

  const updateFileState = (path: string, updates: Partial<FileAnalysis>) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, ...updates } : f))
    );
  };

  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const extensions: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cpp: "c++",
      go: "go",
    };
    return extensions[extension] || "text";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-destructive";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button variant="outline" className="w-full" asChild>
            <div>
              <UploadCloud className="mr-2" />
              Select Files to Analyze
            </div>
          </Button>
        </label>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.go"
        />
      </div>

      {files.length > 0 ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
            {files.map((file) => (
              <TabsTrigger
                key={file.path}
                value={file.path}
                className="flex items-center gap-2"
              >
                {file.path}
                {file.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : file.error ? (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                ) : file.suggestions.length > 0 ? (
                  <Badge
                    variant="destructive"
                    className="h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {file.suggestions.length}
                  </Badge>
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {files.map((file) => (
            <TabsContent
              key={file.path}
              value={file.path}
              className="flex-1 flex flex-col mt-0"
            >
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b p-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">
                      {file.path}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleListen(file)}
                        disabled={
                          file.loading ||
                          file.isGeneratingAudio ||
                          file.suggestions.length === 0
                        }
                      >
                        {file.isGeneratingAudio ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Volume2 className="h-4 w-4 mr-2" />
                        )}
                        Listen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(file)}
                        disabled={
                          file.loading ||
                          file.isExporting ||
                          file.suggestions.length === 0
                        }
                      >
                        {file.isExporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadAndAnalyzeFile(file)}
                        disabled={file.loading}
                      >
                        {file.loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Re-analyze
                      </Button>
                    </div>
                  </div>
                  {file.audioSrc && (
                    <div className="pt-3">
                      <audio controls autoPlay className="w-full h-8">
                        <source src={file.audioSrc} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </CardHeader>
                <div className="flex-1 flex overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-250px)] w-full">
                    <div className="p-4">
                      <pre className="relative text-sm">
                        {file.content.split("\n").map((line, i) => {
                          const lineNumber = i + 1;
                          const lineSuggestions = file.suggestions.filter(
                            (s) => s.lineNumber === lineNumber
                          );
                          const hasSuggestions = lineSuggestions.length > 0;

                          return (
                            <div
                              key={i}
                              className={`relative group rounded-md ${
                                hasSuggestions ? "bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex items-start px-2 py-1">
                                <div className="text-right text-muted-foreground mr-4 w-8 flex-shrink-0 select-none">
                                  {lineNumber}
                                </div>
                                <div className="font-mono whitespace-pre-wrap flex-1">
                                  {line || " "}
                                </div>
                              </div>

                              {hasSuggestions && (
                                <div className="ml-16 mb-2 mr-2">
                                  {lineSuggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className={`text-xs p-2 mt-1 rounded-md bg-secondary/80 border-l-4 ${getSeverityBorderColor(
                                        suggestion.severity || "low"
                                      )}`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <div
                                          className={`h-2 w-2 rounded-full ${getSeverityColor(
                                            suggestion.severity || "medium"
                                          )}`}
                                        />
                                        <span className="font-semibold capitalize text-secondary-foreground">
                                          {suggestion.type || "quality"}
                                        </span>
                                        <span className="text-muted-foreground">
                                          •
                                        </span>
                                        <span className="font-medium capitalize text-secondary-foreground">
                                          {suggestion.severity}
                                        </span>
                                      </div>
                                      <div className="text-secondary-foreground">
                                        {suggestion.message}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg bg-secondary/40">
          <div className="text-center p-8">
            <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-semibold mb-2">
              No files selected
            </p>
            <p className="text-sm text-muted-foreground/80">
              Select local files to start analyzing your code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
