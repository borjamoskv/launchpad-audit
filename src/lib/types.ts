export type PriorityLevel = "high" | "medium" | "low";

export interface RepoMetrics {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  primaryLanguage: string | null;
  license: string | null;
  homepage: string | null;
  hasRelease: boolean;
  createdAt: string;
  pushedAt: string;
}

export interface AuditCheck {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  points: number;
  detail: string;
  suggestedAction: string;
  priority: PriorityLevel;
}

export interface PrioritizedAction {
  title: string;
  description: string;
  impact: string;
  priority: PriorityLevel;
}

export interface DistributionPost {
  channel: string;
  hook: string;
  copy: string;
  cta: string;
  recommendedWhen: string;
}

export interface AuditResponse {
  objective: string;
  repoUrl: string;
  score: number;
  maxScore: number;
  summary: string;
  metrics: RepoMetrics;
  checks: AuditCheck[];
  actions: PrioritizedAction[];
  distributionPlan: DistributionPost[];
}

export interface AuditRequest {
  repoUrl: string;
  objective: string;
  githubToken?: string;
}
