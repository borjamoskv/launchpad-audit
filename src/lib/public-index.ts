import { buildRepoSharePath } from "@/lib/share";

export interface FeaturedPublicRepo {
  fullName: string;
  description: string;
  category: string;
  whyAudit: string;
  tags: string[];
}

const FEATURED_PUBLIC_REPOS: FeaturedPublicRepo[] = [
  {
    fullName: "vercel/next.js",
    description: "React framework with a large contributor surface and mature distribution loop.",
    category: "Frontend",
    whyAudit: "Benchmark for docs, issues, templates and public contribution flow.",
    tags: ["react", "framework", "docs"],
  },
  {
    fullName: "facebook/react",
    description: "Core UI library with huge adoption and high signal community workflows.",
    category: "Frontend",
    whyAudit: "Useful baseline for trust signals, release cadence and issue triage.",
    tags: ["ui", "library", "community"],
  },
  {
    fullName: "vitejs/vite",
    description: "Modern build tool with strong developer experience and plugin ecosystem.",
    category: "Frontend",
    whyAudit: "Good example for conversion-focused docs and ecosystem positioning.",
    tags: ["build", "dx", "plugins"],
  },
  {
    fullName: "tailwindlabs/tailwindcss",
    description: "Utility-first CSS framework with tight onboarding and strong examples.",
    category: "Frontend",
    whyAudit: "Shows how demo, docs and community proof affect GitHub conversion.",
    tags: ["css", "design", "onboarding"],
  },
  {
    fullName: "supabase/supabase",
    description: "Open source backend platform with broad product-led growth mechanics.",
    category: "Backend",
    whyAudit: "Strong reference for positioning, launch channels and contributor entry points.",
    tags: ["backend", "database", "growth"],
  },
  {
    fullName: "fastapi/fastapi",
    description: "Python API framework known for documentation quality and fast adoption.",
    category: "Backend",
    whyAudit: "Highlights how README clarity and examples can compound adoption.",
    tags: ["python", "api", "docs"],
  },
  {
    fullName: "django/django",
    description: "Mature Python web framework with long-running governance and releases.",
    category: "Backend",
    whyAudit: "Useful for auditing established projects with strong maintenance signals.",
    tags: ["python", "web", "governance"],
  },
  {
    fullName: "nodejs/node",
    description: "JavaScript runtime with a large release and contribution surface.",
    category: "Runtime",
    whyAudit: "Good stress case for issue templates, contribution docs and release trust.",
    tags: ["runtime", "javascript", "releases"],
  },
  {
    fullName: "microsoft/vscode",
    description: "Developer tool with massive community usage and extension ecosystem.",
    category: "Developer Tools",
    whyAudit: "Reference for scaling public feedback and contributor pathways.",
    tags: ["editor", "extensions", "community"],
  },
  {
    fullName: "rust-lang/rust",
    description: "Programming language repo with strong process, RFCs and governance.",
    category: "Developer Tools",
    whyAudit: "Audits the discoverability of a process-heavy engineering project.",
    tags: ["language", "governance", "process"],
  },
  {
    fullName: "denoland/deno",
    description: "Modern JavaScript runtime with product narrative and release velocity.",
    category: "Runtime",
    whyAudit: "Useful comparison point for launch copy, docs and positioning.",
    tags: ["runtime", "typescript", "security"],
  },
  {
    fullName: "huggingface/transformers",
    description: "Machine learning library with broad ecosystem and model distribution.",
    category: "AI",
    whyAudit: "Shows how examples, docs and public integrations affect adoption.",
    tags: ["ai", "models", "python"],
  },
  {
    fullName: "pytorch/pytorch",
    description: "Deep learning framework with enterprise-scale contribution workflows.",
    category: "AI",
    whyAudit: "Stress test for mature OSS onboarding and release trust signals.",
    tags: ["ai", "ml", "framework"],
  },
  {
    fullName: "langchain-ai/langchain",
    description: "AI application framework with fast-moving docs and examples.",
    category: "AI",
    whyAudit: "Good audit target for repos where narrative and examples change quickly.",
    tags: ["agents", "llm", "apps"],
  },
  {
    fullName: "openai/openai-python",
    description: "Official Python SDK with direct developer onboarding impact.",
    category: "AI",
    whyAudit: "Reference for SDK docs, releases and issue flow around fast-changing APIs.",
    tags: ["sdk", "python", "api"],
  },
  {
    fullName: "kubernetes/kubernetes",
    description: "Container orchestration project with large governance and release surface.",
    category: "Infrastructure",
    whyAudit: "Useful for testing score behavior on very large, process-heavy repos.",
    tags: ["infra", "containers", "governance"],
  },
];

export const EXPLORE_PATH = "/explore";

export const getFeaturedPublicRepos = (): FeaturedPublicRepo[] => {
  return [...FEATURED_PUBLIC_REPOS];
};

export const buildFeaturedRepoPath = (repo: FeaturedPublicRepo): string => {
  const path = buildRepoSharePath(repo.fullName);

  if (!path) {
    throw new Error(`Invalid featured repo fullName: ${repo.fullName}`);
  }

  return path;
};

export const getFeaturedPublicRepoPaths = (): string[] => {
  return getFeaturedPublicRepos().map(buildFeaturedRepoPath);
};

export const getFeaturedCategories = (): string[] => {
  return Array.from(new Set(FEATURED_PUBLIC_REPOS.map((repo) => repo.category))).sort((a, b) =>
    a.localeCompare(b),
  );
};
