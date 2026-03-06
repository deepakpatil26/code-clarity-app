import { Octokit } from "octokit";
import { AllFindings, qualityScorer } from "./quality-scorer";

export class PRCommenter {
  /**
   * Posts a summary review and inline comments to the PR.
   */
  async postReview(
    repoFullName: string,
    prNumber: number,
    findings: AllFindings,
    score: number,
    octokit: Octokit
  ) {
    const [owner, repo] = repoFullName.split("/");

    // 1. Generate the main review comment
    const mainComment = this.generateSummaryComment(findings, score);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: mainComment,
    });

    // 2. Generate inline comments
    const inlineComments = this.generateInlineComments(findings);

    if (inlineComments.length > 0) {
      // Limit to top 15 comments to avoid spamming
      const topComments = inlineComments.slice(0, 15);
      
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: "COMMENT",
        comments: topComments.map(c => ({
          path: c.path,
          line: c.line,
          body: c.body,
        })),
      });
    }
  }

  private generateSummaryComment(findings: AllFindings, score: number): string {
    const grade = qualityScorer.getGrade(score);
    const securityCritical = findings.security.filter(f => f.severity === "critical" || f.severity === "high").length;
    const performanceIssues = findings.performance.length;
    const complexityWarnings = findings.complexity.warnings.length;

    return `
## 🤖 CodeClarity Pro AI Review

### Quality Score: **${score.toFixed(1)}/10** (${grade})

---

### 📊 Analysis Summary

| Category | Finding Count | Status |
|----------|---------------|--------|
| 🔴 Security Issues | ${securityCritical} | ${securityCritical > 0 ? "⚠️ ACTION REQUIRED" : "✅ CLEAR"} |
| ⚡ Performance Concerns | ${performanceIssues} | ${performanceIssues > 0 ? "💡 OPTIMIZABLE" : "✅ GOOD"} |
| 📐 Complexity Warnings | ${complexityWarnings} | ${complexityWarnings > 5 ? "⚠️ REFACTOR NEEDED" : "✅ MAINTAINABLE"} |

---

### 📈 Code Quality Metrics
- **Maintainability Index**: ${findings.complexity.maintainabilityIndex.toFixed(1)}
- **Cyclomatic Complexity**: ${findings.complexity.cyclomaticComplexity}
- **Lines of Code (approx)**: ${findings.complexity.linesOfCode}
- **Max Nesting Depth**: ${findings.complexity.maxNestingDepth}

---

### 🔍 Top Findings

${findings.security.filter(f => f.severity === "critical").map(f => `
#### 🔴 SECURITY: ${f.type} (Line ${f.line})
- **Message**: ${f.message}
- **💡 Suggestion**: ${f.suggestion}
`).join('\n') || "_No critical security issues found._"}

${findings.performance.filter(f => f.severity === "high").map(f => `
#### ⚡ PERFORMANCE: ${f.type} (Line ${f.line})
- **Message**: ${f.message}
- **💡 Suggestion**: ${f.suggestion}
`).join('\n') || ""}

---

_⚙️ Powered by [CodeClarity Pro](https://code-clarity-app.vercel.app)_
`;
  }

  private generateInlineComments(findings: AllFindings): { path: string, line: number, body: string }[] {
    const comments: { path: string, line: number, body: string }[] = [];

    // Note: In a real diff analysis, we'd need to map the absolute line to the diff line.
    // For now, we'll use the absolute line (which works if the file is small or if Octokit handles it).
    // TODO: Improve line mapping for diffs.

    findings.security.forEach(f => {
      comments.push({
        path: "", // This needs to be set from the file being analyzed
        line: f.line,
        body: `🔴 **Security Risk: ${f.type}**\n\n${f.message}\n\n💡 **Suggestion**: ${f.suggestion}`,
      });
    });

    findings.performance.forEach(f => {
      comments.push({
        path: "",
        line: f.line,
        body: `⚡ **Performance Concern: ${f.type}**\n\n${f.message}\n\n💡 **Suggestion**: ${f.suggestion}`,
      });
    });

    return comments;
  }
}

export const prCommenter = new PRCommenter();
