export interface AddedLine {
  patchLine: number;
  lineNumber: number;
  content: string;
}

export interface ParsedPatch {
  addedLines: AddedLine[];
  addedCode: string;
  lineMap: Record<number, number>;
}

/**
 * Extracts added lines from a unified diff patch and maps patch line index -> new file line number.
 * Only lines starting with "+" (and not "+++") are considered.
 */
export function parseUnifiedDiffPatch(patch: string): ParsedPatch {
  const lines = patch.split("\n");
  const addedLines: AddedLine[] = [];
  const lineMap: Record<number, number> = {};

  let newLine = 0;
  let oldLine = 0;
  let patchLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = /@@\s-\d+(?:,\d+)?\s\+(\d+)(?:,\d+)?\s@@/.exec(line);
      if (match) {
        newLine = parseInt(match[1], 10);
        // Reset oldLine even if unused to keep counters aligned
        const oldMatch = /@@\s-(\d+)(?:,\d+)?\s\+/.exec(line);
        oldLine = oldMatch ? parseInt(oldMatch[1], 10) : oldLine;
        patchLine = 0;
      }
      continue;
    }

    if (line.startsWith("\\ No newline at end of file")) {
      continue;
    }

    // Added line
    if (line.startsWith("+") && !line.startsWith("+++")) {
      patchLine += 1;
      addedLines.push({
        patchLine,
        lineNumber: newLine,
        content: line.slice(1),
      });
      lineMap[addedLines.length] = newLine;
      newLine += 1;
      continue;
    }

    // Removed line
    if (line.startsWith("-") && !line.startsWith("---")) {
      oldLine += 1;
      continue;
    }

    // Context line
    if (line.startsWith(" ")) {
      newLine += 1;
      oldLine += 1;
      continue;
    }
  }

  const addedCode = addedLines.map((l) => l.content).join("\n");
  return { addedLines, addedCode, lineMap };
}
