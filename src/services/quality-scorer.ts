import { SecurityFinding } from "./analyzers/security";
import { ComplexityFinding } from "./analyzers/complexity";
import { PerformanceFinding } from "./analyzers/performance";

export interface AllFindings {
  security: SecurityFinding[];
  complexity: ComplexityFinding;
  performance: PerformanceFinding[];
}

export class QualityScorer {
  /**
   * Calculates a quality score from 0.0 to 10.0 based on findings.
   */
  calculateScore(findings: AllFindings): number {
    let score = 10.0;

    // 1. Security Deductions (Heavy)
    const criticalSecurity = findings.security.filter((f) => f.severity === "critical").length;
    const highSecurity = findings.security.filter((f) => f.severity === "high").length;
    const mediumSecurity = findings.security.filter((f) => f.severity === "medium").length;

    score -= criticalSecurity * 2.5;
    score -= highSecurity * 1.5;
    score -= mediumSecurity * 0.5;

    // 2. Complexity Deductions
    if (findings.complexity.cyclomaticComplexity > 15) {
      score -= (findings.complexity.cyclomaticComplexity - 15) * 0.2;
    }
    if (findings.complexity.maxNestingDepth > 4) {
      score -= (findings.complexity.maxNestingDepth - 4) * 0.5;
    }
    if (findings.complexity.maintainabilityIndex < 60) {
      score -= (60 - findings.complexity.maintainabilityIndex) * 0.1;
    }

    // 3. Performance Deductions
    const highPerf = findings.performance.filter((f) => f.severity === "high").length;
    const mediumPerf = findings.performance.filter((f) => f.severity === "medium").length;

    score -= highPerf * 1.0;
    score -= mediumPerf * 0.3;

    // Clamp score between 0 and 10
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Returns a human-readable grade based on the score.
   */
  getGrade(score: number): string {
    if (score >= 9.0) return "A+";
    if (score >= 8.0) return "A";
    if (score >= 7.0) return "B";
    if (score >= 6.0) return "C";
    if (score >= 5.0) return "D";
    return "F";
  }
}

export const qualityScorer = new QualityScorer();
