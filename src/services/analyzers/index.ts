import { securityAnalyzer } from "./security";
import { complexityAnalyzer } from "./complexity";
import { performanceAnalyzer } from "./performance";

export {
  securityAnalyzer,
  complexityAnalyzer,
  performanceAnalyzer,
};

export const allAnalyzers = [
  securityAnalyzer,
  complexityAnalyzer,
  performanceAnalyzer,
];
