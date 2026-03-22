
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "./ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SuggestCodeImprovementsOutput } from "@/ai/schemas/code-analysis";
import { ShieldCheck, Zap, Activity, Award, Download, Bot, FileCheck2, Loader2, Volume2, Copy, Check, MessageSquare, Send, RefreshCw } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { generateAnalysisReport, generateAnalysisReportPdf } from "@/lib/reports";
import { chatWithAnalysis } from "@/ai/flows/chat-with-analysis";
import { Input } from "./ui/input";

function ChatArea({
  code,
  finding,
  onClose
}: {
  code: string;
  finding: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const result = await chatWithAnalysis({
        codeContext: code,
        finding: finding,
        userMessage: message,
      });
      setResponse(result.response);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Chat Failed",
        description: "Could not get a response from AI.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tighter">
          <MessageSquare className="h-3 w-3" />
          Interactive Explainer
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onClose}>Close Chat</Button>
      </div>

      {response ? (
        <div className="p-3 rounded-lg bg-background/50 text-sm leading-relaxed border border-primary/5 text-foreground">
          <span className="font-bold text-primary block mb-1 text-[10px] uppercase">AI Explanation:</span>
          {response}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 h-7 w-full border border-dashed text-[10px]"
            onClick={() => { setResponse(null); setMessage(""); }}
          >
            Ask another question
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Ask why or how to fix..."
            className="h-9 text-xs bg-background/50 border-primary/10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button
            size="sm"
            className="h-9 px-3 rounded-lg bg-primary"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass
}: {
  label: string;
  value: number;
  icon: any;
  colorClass: string;
}) {
  return (
    <div className="bg-card/40 border border-primary/10 rounded-2xl p-4 md:p-5 flex flex-col gap-3 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <span className="text-xl md:text-2xl font-black tabular-nums tracking-tighter">{value}/10</span>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] uppercase font-black tracking-[0.15em] text-muted-foreground/80">{label}</p>
        <Progress value={value * 10} className={`h-1.5 md:h-2 ${colorClass.replace('text-', 'bg-')}/20`} />
      </div>
    </div>
  );
}

function MetricsDashboard({ summary }: { summary: NonNullable<SuggestCodeImprovementsOutput["summary"]> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      <div className="lg:col-span-1 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 backdrop-blur-xl shadow-lg">
        <Award className="h-8 w-8 text-primary mb-1 animate-bounce-slow" />
        <span className="text-5xl font-black text-foreground drop-shadow-lg">{summary.overallGrade}</span>
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-80">Project Health</p>
      </div>
      <MetricCard
        label="Security"
        value={summary.securityScore}
        icon={ShieldCheck}
        colorClass="text-red-500"
      />
      <MetricCard
        label="Quality"
        value={summary.qualityScore}
        icon={Activity}
        colorClass="text-blue-500"
      />
      <MetricCard
        label="Performance"
        value={summary.performanceScore}
        icon={Zap}
        colorClass="text-amber-500"
      />
    </div>
  );
}

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SuggestCodeImprovementsOutput | null;
  title: string;
  code: string;
}

export function AnalysisDialog({
  open,
  onOpenChange,
  result,
  title,
  code,
}: AnalysisDialogProps) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [chattingIndex, setChattingIndex] = useState<number | null>(null);
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
      const suggestionsText = result.suggestions.map(s => s.message).join(". ");
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
        {result.summary && <MetricsDashboard summary={result.summary} />}
        {result.suggestions.map((suggestion, index) => {
          const isError = suggestion.message.includes("AI Analysis Error");
          const severityColor = suggestion.severity === "high" ? "text-red-500 bg-red-500/10" :
            suggestion.severity === "medium" ? "text-amber-500 bg-amber-500/10" :
              "text-blue-500 bg-blue-500/10";

          return (
            <div
              key={index}
              className={`group flex flex-col gap-4 p-4 md:p-6 rounded-2xl border transition-all duration-300 ${isError
                  ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                  : "bg-card/30 hover:bg-accent/5 hover:border-primary/30 shadow-sm hover:shadow-xl hover:translate-y-[-2px] backdrop-blur-sm"
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5 shadow-inner ${isError ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
                  }`}>
                  <Bot className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {suggestion.line && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/20">L{suggestion.line}</Badge>}
                    {suggestion.type && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-tighter">{suggestion.type}</Badge>}
                    {suggestion.severity && <Badge className={`text-[10px] h-5 px-1.5 uppercase tracking-tighter ${severityColor}`}>{suggestion.severity}</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground font-medium">
                    {suggestion.message}
                  </p>

                  {suggestion.suggestedFix && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-primary/10 bg-black/5 dark:bg-black/40">
                      <div className="bg-muted px-3 py-1.5 flex items-center justify-between border-b border-primary/5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Suggested Fix</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => copyToClipboard(suggestion.suggestedFix!, index + 1000)}
                        >
                          {copiedIndex === index + 1000 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          Copy Fix
                        </Button>
                      </div>
                      <pre className="p-4 text-xs font-mono overflow-x-auto text-primary/90">
                        {suggestion.suggestedFix}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => copyToClipboard(suggestion.message, index)}
                    >
                      {copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedIndex === index ? "Copied" : "Copy Suggestion"}
                    </Button>
                    {!isError && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 text-xs gap-1.5 transition-colors ${chattingIndex === index ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => setChattingIndex(chattingIndex === index ? null : index)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {chattingIndex === index ? "Chatting..." : "Chat with AI"}
                      </Button>
                    )}
                  </div>
                  {chattingIndex === index && !isError && (
                    <ChatArea
                      code={code}
                      finding={suggestion.message}
                      onClose={() => setChattingIndex(null)}
                    />
                  )}
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
      <DialogContent className="dark text-foreground sm:max-w-4xl glass p-0 border border-white/10 overflow-hidden w-full h-full max-h-none sm:h-auto sm:max-h-[90vh] sm:rounded-3xl rounded-none flex flex-col bg-black/95 backdrop-blur-3xl shadow-2xl transition-all duration-500 ease-in-out">
        <div className="p-6 md:p-10 bg-gradient-to-br from-primary/10 via-background/40 to-accent/5 border-b border-white/5 shrink-0">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-primary text-white hover:bg-primary px-3 shadow-lg shadow-primary/20 animate-pulse-slow">AI Review</Badge>
              <span className="text-[10px] md:text-xs text-muted-foreground font-black tracking-[0.2em] uppercase opacity-70">CodeClarity Pro V1.0</span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-black tracking-tighter line-clamp-2 leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Deep-scanning your pull request using <span className="text-primary font-bold">Llama 3.3 (Groq)</span> for elite quality, security, and performance.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-4 md:px-10 py-4 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
          <div className="h-10" /> {/* Spacer */}
        </ScrollArea>

        <div className="p-6 md:p-10 bg-secondary/20 border-t border-white/10 backdrop-blur-md shrink-0">
          <DialogFooter className="flex flex-col gap-6">
            {audioSrc && (
              <div className="w-full bg-black/60 rounded-2xl p-4 border border-primary/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Narrator Is Speaking</span>
                </div>
                <audio controls autoPlay className="w-full h-10 filter invert brightness-100 contrast-125">
                  <source src={audioSrc} type="audio/wav" />
                </audio>
              </div>
            )}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <Button
                variant="gradient"
                onClick={handleListen}
                disabled={isGeneratingAudio || !result || result.suggestions.length === 0}
                className="w-full md:flex-1 rounded-2xl h-14 text-base font-black shadow-xl shadow-primary/10 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Volume2 className="mr-3 h-5 w-5" />
                )}
                {isGeneratingAudio ? "Generating Narrator..." : "Listen to Analysis"}
              </Button>
              <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 no-scrollbar shrink-0">
                <Button
                  variant="outline"
                  onClick={() => result && generateAnalysisReport(title, result)}
                  disabled={!result || result.suggestions.length === 0}
                  className="flex-1 md:flex-none rounded-2xl h-14 px-6 font-bold hover:bg-white/10 border-white/10 text-foreground transition-all active:scale-[0.98]"
                >
                  <Download className="mr-2 h-5 w-5 opacity-70" />
                  HTML
                </Button>
                <Button
                  variant="outline"
                  onClick={() => result && generateAnalysisReportPdf(title, result)}
                  disabled={!result || result.suggestions.length === 0}
                  className="flex-1 md:flex-none rounded-2xl h-14 px-6 font-bold hover:bg-white/10 border-white/10 text-foreground transition-all active:scale-[0.98]"
                >
                  <Download className="mr-2 h-5 w-5 opacity-70" />
                  PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 md:flex-none rounded-2xl h-14 px-8 font-black bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-[0.98]"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
