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
import { Bot, FileCheck2, Loader2, Volume2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

  const renderContent = () => {
    if (!result) {
      return (
        <div className="space-y-4 pt-4">
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
      );
    }
    if (result.suggestions.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <FileCheck2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p>No suggestions available. The code looks great!</p>
        </div>
      );
    }
    return (
      <ul className="space-y-4 pt-4">
        {result.suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="flex items-start gap-4 p-3 rounded-md bg-secondary/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary flex-shrink-0 mt-1">
              <Bot className="h-5 w-5" />
            </span>
            <p className="text-sm text-secondary-foreground pt-1.5">
              {suggestion}
            </p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            Analysis for: <span className="font-normal">{title}</span>
          </DialogTitle>
          <DialogDescription>
            AI-powered suggestions to improve the pull request.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">{renderContent()}</ScrollArea>
        <DialogFooter className="border-t pt-4 mt-2 flex-col sm:flex-col sm:space-x-0 gap-2">
          {audioSrc && (
            <div className="w-full">
              <audio controls autoPlay className="w-full">
                <source src={audioSrc} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleListen}
            disabled={
              isGeneratingAudio || !result || result.suggestions.length === 0
            }
            className="w-full"
          >
            {isGeneratingAudio ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="mr-2 h-4 w-4" />
            )}
            Listen to Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
