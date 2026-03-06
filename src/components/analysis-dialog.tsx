"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SuggestCodeImprovementsOutput } from "@/ai/schemas/code-analysis";
import { Bot, FileCheck2, Loader2, Volume2, Copy, Check } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SuggestCodeImprovementsOutput | null;
  title: string;
}

export function AnalysisDialog({
  open,
  onOpenChange,
  result,
  title,
}: AnalysisDialogProps) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleListen = async () => {
    if (!result || result.suggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to read",
        description: "There are no suggestions to turn into audio.",
      });
      return;
    }
    setIsGeneratingAudio(true);
    setAudioSrc(null);
    try {
      const suggestionsText = result.suggestions.join(". ");
      const audioResult = await textToSpeech({
        text: `Analysis for pull request: ${title}. ${suggestionsText}`,
      });
      setAudioSrc(audioResult.audio);
    } catch (error) {
      console.error("Failed to generate audio:", error);
      toast({
        variant: "destructive",
        title: "Audio Generation Failed",
        description: "An unexpected error occurred while generating the audio.",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste this suggestion into your code.",
    });
  };

  const renderContent = () => {
    if (!result) {
      return (
        <div className="space-y-4 pt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border bg-card/50">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (result.suggestions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16 bg-primary/5 rounded-3xl border border-dashed">
          <FileCheck2 className="h-16 w-16 text-primary/30 mx-auto mb-4 animate-bounce-slow" />
          <h3 className="text-xl font-bold text-foreground mb-2">Perfect Code!</h3>
          <p>No issues found. Your code is ready to ship! ✨</p>
        </div>
      );
    }
    return (
      <div className="space-y-4 pt-4">
        {result.suggestions.map((suggestion, index) => {
          const isError = suggestion.includes("AI Analysis Error");
          return (
            <div
              key={index}
              className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                isError 
                ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" 
                : "bg-card hover:bg-accent/5 hover:border-primary/30 shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5 shadow-inner ${
                isError ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
              }`}>
                <Bot className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm leading-relaxed text-foreground font-medium">
                  {suggestion}
                </p>
                <div className="flex items-center gap-2">
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                     onClick={() => copyToClipboard(suggestion, index)}
                   >
                     {copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                     {copiedIndex === index ? "Copied" : "Copy Suggestion"}
                   </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl glass p-0 border-none overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-background to-accent/5 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <Badge className="bg-primary text-white hover:bg-primary px-3 shadow-lg shadow-primary/20">AI Review</Badge>
               <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">V1.0 Pro</span>
            </div>
            <DialogTitle className="text-2xl font-extrabold tracking-tight line-clamp-1">
              {title}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Reviewing your pull request for quality, security, and performance.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6 md:px-8 py-2 overflow-y-auto">
          {renderContent()}
          <div className="h-6" /> {/* Spacer */}
        </ScrollArea>

        <div className="p-6 md:p-8 bg-secondary/20 border-t backdrop-blur-md">
          <DialogFooter className="flex flex-col sm:flex-col gap-4">
            {audioSrc && (
              <div className="w-full bg-background/50 rounded-xl p-3 border shadow-inner overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <audio controls autoPlay className="w-full h-10">
                  <source src={audioSrc} type="audio/wav" />
                </audio>
              </div>
            )}
            <div className="flex gap-3">
               <Button
                 variant="gradient"
                 onClick={handleListen}
                 disabled={isGeneratingAudio || !result || result.suggestions.length === 0}
                 className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20"
               >
                 {isGeneratingAudio ? (
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                 ) : (
                   <Volume2 className="mr-2 h-5 w-5" />
                 )}
                 Listen to Full Analysis
               </Button>
               <Button
                 variant="outline"
                 onClick={() => onOpenChange(false)}
                 className="rounded-xl h-12 px-8 font-semibold hover:bg-background"
               >
                 Dismiss
               </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
