export interface PerformanceFinding {
  type: string;
  severity: "low" | "medium" | "high";
  line: number;
  message: string;
  suggestion: string;
}

export class PerformanceAnalyzer {
  /**
   * Analyzes code for performance anti-patterns.
   */
  async analyze(code: string, language: string): Promise<PerformanceFinding[]> {
    const findings: PerformanceFinding[] = [];

    const antiPatterns: Record<string, { regex: RegExp; message: string; suggestion: string; severity: PerformanceFinding["severity"] }> = {
      nested_loops: {
        regex: /(for|while|foreach)\s*\(.*{[^}]*(for|while|foreach)\s*\(/gi,
        message: "Nested loops detected. This can lead to O(n^2) or worse time complexity.",
        suggestion: "Consider using a Map or Set to reduce complexity to O(n).",
        severity: "medium",
      },
      sync_in_loop: {
        regex: /(for|while|foreach)\s*\(.*{[^}]*await\s+/gi,
        message: "Asynchronous operation (await) inside a loop.",
        suggestion: "Consider using Promise.all() for concurrent execution.",
        severity: "high",
      },
      multiple_regex_execs: {
        regex: /\bnew\s+RegExp\(.*\)\.test\(.*\)/gi,
        message: "Inefficient regex testing. New RegExp created every time.",
        suggestion: "Extract the RegExp once and reuse it.",
        severity: "low",
      },
      inefficient_array_concat: {
        regex: /\.concat\(.*\)\.concat\(/gi,
        message: "Chain of array concatenation. Can be memory-intensive.",
        suggestion: "Use the spread operator or push to a temporary array.",
        severity: "low",
      },
    };

    for (const [type, info] of Object.entries(antiPatterns)) {
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

    return findings;
  }
}

export const performanceAnalyzer = new PerformanceAnalyzer();
