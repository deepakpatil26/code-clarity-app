import { SuggestCodeImprovementsOutput } from "@/ai/schemas/code-analysis";

export function buildAnalysisReportHtml(title: string, result: SuggestCodeImprovementsOutput) {
  const { suggestions, summary } = result;
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodeClarity Pro Analysis Report - ${title}</title>
      <style>
        :root {
          --primary: #8b5cf6;
          --accent: #d946ef;
          --bg: #030712;
          --card: #111827;
          --text: #f9fafb;
          --text-muted: #9ca3af;
          --border: #1f2937;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: var(--bg);
          color: var(--text);
          line-height: 1.6;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          background: linear-gradient(to right, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header p {
          color: var(--text-muted);
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .metric-card {
          background-color: var(--card);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border);
          text-align: center;
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary);
        }
        .metric-label {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .grade-card {
          grid-column: span 3;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1));
        }
        .grade-value {
          font-size: 3rem;
          color: var(--accent);
        }
        .suggestions-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        .suggestion-item {
          background-color: var(--card);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 16px;
        }
        .suggestion-header {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .tag {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .tag-security { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .tag-quality { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .tag-performance { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .footer {
          text-align: center;
          margin-top: 60px;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CodeClarity Pro Analysis</h1>
          <p>Full technical report for: <strong>${title}</strong></p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        ${summary ? `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${summary.securityScore}/10</div>
            <div class="metric-label">Security</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${summary.qualityScore}/10</div>
            <div class="metric-label">Quality</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${summary.performanceScore}/10</div>
            <div class="metric-label">Performance</div>
          </div>
          <div class="metric-card grade-card">
            <span>Overall Project Grade:</span>
            <span class="grade-value">${summary.overallGrade}</span>
          </div>
        </div>
        ` : ''}

        <h2 class="suggestions-title">Detailed Findings (${suggestions.length})</h2>
        <div class="suggestions-list">
          ${suggestions.map(s => {
            const type = s.type || 'quality';
            const severity = s.severity || 'low';
            return `
            <div class="suggestion-item">
              <div class="suggestion-header">
                <span class="tag tag-${type}">${type}</span>
                <span class="tag" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border)">
                  ${severity.toUpperCase()}
                </span>
                ${s.line ? `<span class="tag" style="background: var(--primary); color: white">Line ${s.line}</span>` : ''}
              </div>
              <div class="suggestion-text">${s.message}</div>
              ${s.suggestedFix ? `
                <div style="margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; font-size: 0.8rem; border: 1px solid var(--border); overflow-x: auto;">
                  <div style="color: var(--primary); font-weight: bold; margin-bottom: 5px; font-size: 0.7rem; text-transform: uppercase;">Suggested Fix:</div>
                  <pre style="margin: 0;">${s.suggestedFix}</pre>
                </div>
              ` : ''}
            </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          Made with 💎 by CodeClarity Pro
        </div>
      </div>
    </body>
    </html>
  `;
  return html;
}

export function generateAnalysisReport(title: string, result: SuggestCodeImprovementsOutput) {
  const html = buildAnalysisReportHtml(title, result);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CodeClarity_Report_${title.replace(/[^a-z0-9]/gi, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadHtmlAsPdf(html: string, filename: string) {
  try {
    const { default: html2pdf } = await import("html2pdf.js");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();

    document.body.removeChild(container);
  } catch (error) {
    // Fallback: open print dialog (user can Save as PDF)
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      throw new Error("Popup blocked. Please allow popups to export PDF.");
    }
    win.document.title = filename.replace(/\.pdf$/i, "");
    win.addEventListener(
      "load",
      () => {
        win.focus();
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      { once: true }
    );
  }
}

export async function generateAnalysisReportPdf(title: string, result: SuggestCodeImprovementsOutput) {
  const html = buildAnalysisReportHtml(title, result);
  const filename = `CodeClarity_Report_${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  await downloadHtmlAsPdf(html, filename);
}
