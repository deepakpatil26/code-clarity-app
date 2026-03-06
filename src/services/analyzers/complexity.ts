export interface ComplexityFinding {
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  warnings: string[];
}

export class ComplexityAnalyzer {
  /**
   * Analyzes code for complexity metrics.
   */
  async analyze(code: string, language: string): Promise<ComplexityFinding> {
    const lines = code.split("\n");
    const loc = lines.filter((line) => line.trim()).length;

    // 1. Cyclomatic Complexity Heuristic
    const complexityKeywords = [
      /\bif\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcatch\s*\(/g,
      /\bcase\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // Ternary
    ];

    let complexity = 1; // Base
    for (const pattern of complexityKeywords) {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    }

    // 2. Max Nesting Depth
    let currentDepth = 0;
    let maxDepth = 0;
    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      currentDepth += openBraces;
      if (currentDepth > maxDepth) maxDepth = currentDepth;
      currentDepth -= closeBraces;
    }

    // 3. Maintainability Index (Simplified)
    // Common formula: 171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic Complexity - 16.2 * ln(LoC)
    // We'll use a very simplified version: 100 - (Complexity * 2) - (MaxDepth * 5) - (LoC / 10)
    const maintainabilityIndex = Math.max(0, 100 - complexity * 1.5 - maxDepth * 3 - loc / 20);

    const warnings: string[] = [];
    if (complexity > 15) warnings.push(`High cyclomatic complexity (${complexity}). Consider refactoring.`);
    if (maxDepth > 4) warnings.push(`Deeply nested code (depth: ${maxDepth}).`);
    if (loc > 300) warnings.push(`Large file (${loc} lines). Consider splitting.`);

    return {
      cyclomaticComplexity: complexity,
      maxNestingDepth: maxDepth,
      linesOfCode: loc,
      maintainabilityIndex,
      warnings,
    };
  }
}

export const complexityAnalyzer = new ComplexityAnalyzer();
