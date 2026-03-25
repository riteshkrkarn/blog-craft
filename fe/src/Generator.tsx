import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  Copy,
  FileText,
  Code,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API base URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE = "http://localhost:8000/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared UI Components (matching landing page theme)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseStyles =
    "px-7 py-3.5 rounded-xl font-headline font-semibold text-sm tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg hover:opacity-90",
    secondary:
      "bg-surface-container-highest text-on-surface hover:bg-surface-container-high",
    tertiary: "text-on-surface-variant hover:text-primary",
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({
  children,
  className = "",
  glass = false,
}: {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}) => (
  <div
    className={`rounded-2xl ${
      glass ? "glass-card" : "bg-surface-container-lowest"
    } ghost-border ${className}`}
  >
    {children}
  </div>
);

const BackButton = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-semibold text-sm mb-8"
  >
    <ArrowLeft className="w-4 h-4" /> {label}
  </button>
);

const LoadingSpinner = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center min-h-[40vh] text-center"
  >
    <div className="relative mb-8">
      <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </div>
    <p className="text-xl text-primary font-medium animate-pulse">{message}</p>
  </motion.div>
);

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
    <p className="text-red-600 font-medium mb-4">{message}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" /> Retry
      </Button>
    )}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Strategy {
  id: number;
  title: string;
  description: string;
}

interface OutlineItem {
  paragraph_number: number;
  goal: string;
  key_points: string[];
  transition_intent: string;
  user_insight_used?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 1: Input Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface InputPageProps {
  topic: string;
  setTopic: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  wordCount: number;
  setWordCount: (v: number) => void;
  insights: string;
  setInsights: (v: string) => void;
  setProjectId: (v: string) => void;
  setStrategies: (v: Strategy[]) => void;
  onNext: () => void;
}

const InputPage = ({
  topic, setTopic,
  audience, setAudience,
  wordCount, setWordCount,
  insights, setInsights,
  setProjectId,
  setStrategies,
  onNext,
}: InputPageProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          word_count: wordCount,
          user_insights: insights || null,
          enable_research: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create project");
      }

      const data = await res.json();
      setProjectId(data.project_id);
      setStrategies(data.strategies);
      onNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Generating strategies for your blog..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold mb-4 text-on-surface">
          Craft Your Blog
        </h1>
        <p className="text-on-surface-variant text-lg">
          Set the foundational parameters for your article. Our AI engine will handle the structural logic.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <Card className="p-8 shadow-xl mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Topic / Main Idea
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-surface-container p-4 rounded-xl border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="e.g., The benefits of modular writing frameworks"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Target Audience
              </label>
              <input
                type="text"
                required
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-surface-container p-4 rounded-xl border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="e.g., Content marketers & SEO specialists"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">
                Desired Word Count
              </label>
              <input
                type="number"
                required
                min={100}
                max={5000}
                step={100}
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                className="w-full bg-surface-container p-4 rounded-xl border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Personal Insights (Optional)
            </label>
            <textarea
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              className="w-full h-32 bg-surface-container p-4 rounded-xl border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              placeholder="Any unique anecdotes, quotes, or perspectives to include..."
            />
          </div>

          <div className="pt-4 border-t border-surface-container-high">
            <Button type="submit" className="w-full py-5 text-lg">
              Generate Strategies <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 2: Strategy Selection Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StrategyPageProps {
  projectId: string;
  strategies: Strategy[];
  setStrategies: (v: Strategy[]) => void;
  setOutline: (v: OutlineItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const StrategyPage = ({
  projectId,
  strategies,
  setStrategies,
  setOutline,
  onNext,
  onBack,
}: StrategyPageProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async () => {
    if (selectedId === null) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/strategies/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy_id: selectedId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to select strategy");
      }

      const outlineRes = await fetch(`${API_BASE}/projects/${projectId}/outline`);
      if (!outlineRes.ok) throw new Error("Failed to fetch outline");
      const outlineData = await outlineRes.json();

      setOutline(outlineData.outline);
      onNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/strategies/regenerate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to regenerate strategies");
      const data = await res.json();
      setStrategies(data.strategies);
      setSelectedId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Generating paragraph outline..." />;
  }
  if (regenerating) {
    return <LoadingSpinner message="Regenerating strategies..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton onClick={onBack} label="Back to Input" />

      <div className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold mb-4 text-on-surface">
          Choose Your Strategy
        </h1>
        <p className="text-on-surface-variant text-lg">
          Our AI generated 3 unique approaches. Select the one that best fits your vision.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-4 mt-6">
        {strategies.map((s) => (
          <Card
            key={s.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedId === s.id
                ? "outline-2! outline-primary! shadow-lg"
                : ""
            }`}
          >
            <div onClick={() => setSelectedId(s.id)} className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  selectedId === s.id
                    ? "bg-primary text-white"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {s.id}
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-bold text-lg text-on-surface mb-2">
                  {s.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {s.description}
                </p>
              </div>
              {selectedId === s.id && (
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button
          variant="secondary"
          onClick={handleRegenerate}
          className="sm:w-auto"
        >
          <RefreshCw className="w-4 h-4" /> Regenerate Strategies
        </Button>
        <Button
          onClick={handleSelect}
          disabled={selectedId === null}
          className="flex-1 py-5 text-lg"
        >
          Lock Strategy & Generate Outline <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 3: Outline Review Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface OutlinePageProps {
  projectId: string;
  outline: OutlineItem[];
  setOutline: (v: OutlineItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const OutlinePage = ({
  projectId,
  outline,
  setOutline,
  onNext,
  onBack,
}: OutlinePageProps) => {
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/outline/approve`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to approve outline");
      }

      onNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/outline/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paragraph_numbers: null,
          feedback: feedback || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to regenerate outline");
      const data = await res.json();
      setOutline(data.outline);
      setFeedback("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Writing & scoring your blog..." />;
  }
  if (regenerating) {
    return <LoadingSpinner message="Regenerating outline..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton onClick={onBack} label="Back to Strategy" />

      <div className="mb-10 text-center">
        <h1 className="font-headline text-4xl font-bold mb-4 text-on-surface">
          Review Paragraph Outline
        </h1>
        <p className="text-on-surface-variant text-lg">
          Each paragraph is a modular logical unit. Approve when satisfied.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-4 mt-6">
        {outline.map((item, idx) => (
          <Card key={item.paragraph_number} className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {item.paragraph_number}
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-bold text-base text-on-surface mb-2">
                  {item.goal}
                </h3>
                <ul className="space-y-1 mb-3">
                  {item.key_points.map((point, i) => (
                    <li key={i} className="text-on-surface-variant text-sm flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-outline italic">
                  Transition: {item.transition_intent}
                </p>
                {item.user_insight_used && (
                  <p className="text-xs text-primary mt-1">
                    💡 Uses your insight: {item.user_insight_used}
                  </p>
                )}
              </div>
            </div>
            {idx < outline.length - 1 && (
              <div className="flex justify-center mt-4 text-surface-container-high">
                <div className="w-px h-4 bg-surface-container-high" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Feedback + Regenerate */}
      <Card className="p-6 mt-6">
        <label className="block text-sm font-bold text-on-surface mb-2">
          Feedback for Regeneration (Optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full h-20 bg-surface-container p-4 rounded-xl border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
          placeholder="e.g., Make paragraph 3 more specific, add a real-world example..."
        />
        <div className="mt-3">
          <Button variant="secondary" onClick={handleRegenerate}>
            <RefreshCw className="w-4 h-4" /> Regenerate Outline
          </Button>
        </div>
      </Card>

      <div className="mt-8">
        <Button onClick={handleApprove} className="w-full py-5 text-lg">
          Approve Outline & Write Blog <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 4: Result Page (export as Markdown/HTML code block)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ResultPageProps {
  projectId: string;
  onBack: () => void;
}

const ResultPage = ({ projectId, onBack }: ResultPageProps) => {
  const [resultFormat, setResultFormat] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExport = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/export`);
        if (!res.ok) throw new Error("Failed to export blog");
        const data = await res.json();

        const md = data.content;
        setMarkdownContent(md);

        // Convert simple markdown to HTML
        const html = md
          .replace(/^# (.+)$/gm, "<h1>$1</h1>")
          .replace(/^## (.+)$/gm, "<h2>$1</h2>")
          .replace(/^### (.+)$/gm, "<h3>$1</h3>")
          .replace(/\n\n/g, "\n</p>\n<p>\n")
          .replace(/^(?!<[h|p])/gm, "");

        setHtmlContent(`<article>\n<p>\n${html}\n</p>\n</article>`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchExport();
  }, [projectId]);

  const currentOutput = resultFormat === "markdown" ? markdownContent : htmlContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner message="Preparing your content..." />;
  }

  if (error) {
    return (
      <>
        <BackButton onClick={onBack} label="Back to Input" />
        <ErrorMessage message={error} />
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton onClick={onBack} label="Create Another Blog" />

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500 w-8 h-8" />
            Blog Generation Complete
          </h1>
          <p className="text-on-surface-variant mt-2">
            Your structured, logical blog post is ready. Copy in your preferred format.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between bg-surface-container-lowest p-4 border-b border-surface-container-high">
          <div className="flex gap-2">
            <button
              onClick={() => setResultFormat("markdown")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                resultFormat === "markdown"
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <FileText className="w-4 h-4" /> Markdown
            </button>
            <button
              onClick={() => setResultFormat("html")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                resultFormat === "html"
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <Code className="w-4 h-4" /> HTML
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container-high transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Code
              </>
            )}
          </button>
        </div>

        <div className="bg-[#1e1e2e] p-6 overflow-x-auto">
          <pre className="text-[#a6accd] font-mono text-sm leading-relaxed whitespace-pre-wrap">
            <code>{currentOutput}</code>
          </pre>
        </div>
      </Card>
    </motion.div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Root Generator Component (state + routing)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Generator = () => {
  const navigate = useNavigate();

  // Shared state across steps
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [insights, setInsights] = useState("");
  const [projectId, setProjectId] = useState("");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <InputPage
              topic={topic}
              setTopic={setTopic}
              audience={audience}
              setAudience={setAudience}
              wordCount={wordCount}
              setWordCount={setWordCount}
              insights={insights}
              setInsights={setInsights}
              setProjectId={setProjectId}
              setStrategies={setStrategies}
              onNext={() => navigate("/generator/strategies")}
            />
          }
        />
        <Route
          path="strategies"
          element={
            <StrategyPage
              projectId={projectId}
              strategies={strategies}
              setStrategies={setStrategies}
              setOutline={setOutline}
              onNext={() => navigate("/generator/outline")}
              onBack={() => navigate("/generator")}
            />
          }
        />
        <Route
          path="outline"
          element={
            <OutlinePage
              projectId={projectId}
              outline={outline}
              setOutline={setOutline}
              onNext={() => navigate("/generator/result")}
              onBack={() => navigate("/generator/strategies")}
            />
          }
        />
        <Route
          path="result"
          element={
            <ResultPage
              projectId={projectId}
              onBack={() => navigate("/generator")}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default Generator;
