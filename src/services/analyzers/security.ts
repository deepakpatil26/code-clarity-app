import { ai } from "@/ai/genkit";
import { z } from "genkit";

export const SecurityFindingSchema = z.object({
  type: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  line: z.number(),
  filePath: z.string().optional(),
  message: z.string(),
  suggestion: z.string(),
});

export type SecurityFinding = z.infer<typeof SecurityFindingSchema>;

export class SecurityAnalyzer {
  /**
   * Analyzes code for security vulnerabilities.
   */
  async analyze(code: string, language: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // 1. Basic Pattern Matching (Fast)
    const patterns: Record<string, { regex: RegExp; message: string; suggestion: string; severity: SecurityFinding["severity"] }> = {
      sql_injection: {
        regex: /execute\s*\(\s*["`'].*\$.*["`']/gi,
        message: "Potential SQL injection. Variable directly interpolated into query.",
        suggestion: "Use parameterized queries or an ORM.",
        severity: "critical",
      },
      hardcoded_secrets: {
        regex: /(api_key|password|secret|token)\s*=\s*["`'][^"`']+["`']/gi,
        message: "Potential hardcoded secret or credential.",
        suggestion: "Use environment variables or a secret management service.",
        severity: "critical",
      },
      eval_usage: {
        regex: /\beval\s*\(/g,
        message: "Use of 'eval()' is extremely dangerous and can lead to code injection.",
        suggestion: "Refactor to avoid using eval().",
        severity: "critical",
      },
    };

    for (const [type, info] of Object.entries(patterns)) {
      let match;
      while ((match = info.regex.exec(code)) !== null) {
        const line = code.substring(0, match.index).split("\n").length;
        findings.push({
          type,
          severity: info.severity,
          line,
          message: info.message,
          suggestion: info.suggestion,
        });
      }
    }

    // 2. AI-powered Security Analysis (Deep)
    // We'll call this only if code is not too large or if needed.
    // For now, let's keep it simple or integrate into a combined AI analysis later.

    return findings;
  }
}

export const securityAnalyzer = new SecurityAnalyzer();
