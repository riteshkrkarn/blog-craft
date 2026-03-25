/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Brain,
  ListOrdered,
  Zap,
  BarChart3,
  History as HistoryIcon,
  Bold,
  Italic,
  Link2,
  Image as ImageIcon,
  Users,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Generator from "./Generator";

// --- Components ---

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
    "px-7 py-3.5 rounded-xl font-headline font-semibold text-sm tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2";
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
    className={`rounded-2xl ${glass ? "glass-card" : "bg-surface-container-lowest"} ghost-border ${className}`}
  >
    {children}
  </div>
);

const Badge = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded-md ${className}`}
  >
    {children}
  </span>
);

// --- Sections ---

const Navbar = ({ onStart }: { onStart: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-xl shadow-sm py-3" : "bg-transparent py-5"}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="text-2xl font-headline font-extrabold tracking-tighter text-on-surface">
          BlogCraft AI
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {["Features", "Solutions", "Pricing", "Company"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="font-headline font-semibold text-sm tracking-tight text-on-surface-variant hover:text-primary transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="tertiary" className="hidden sm:flex">
            Login
          </Button>
          <Button onClick={onStart}>Get Started</Button>
          <button
            className="md:hidden text-on-surface"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white border-b border-surface-container-high p-6 flex flex-col space-y-4 md:hidden"
          >
            {["Features", "Solutions", "Pricing", "Company"].map((item) => (
              <a
                key={item}
                href="#"
                className="font-headline font-semibold text-lg text-on-surface"
              >
                {item}
              </a>
            ))}
            <hr className="border-surface-container-high" />
            <Button variant="secondary" className="w-full">
              Login
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative pt-20 pb-16 px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface mb-6 leading-[1.1]">
          Write Better Blogs, <br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">
            One Paragraph at a Time
          </span>
        </h1>
        <p className="text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
          Our guided writing workflow: strategy → outline → write → score →
          refine. Build logic into every sentence with AI-powered structure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="px-10 py-5 text-lg" onClick={onStart}>Start Writing Smarter</Button>
          <Button variant="secondary" className="px-10 py-5 text-lg">
            See How It Works
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex justify-center lg:justify-end"
      >
        <div className="absolute -inset-10 bg-linear-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl" />
        <div className="relative rounded-3xl overflow-hidden shadow-2xl ghost-border bg-white max-w-[540px]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDOLTydClwvNchI5p1QeBjprZ-jHt0Lvcw0yn8w7DN8Vz2ZKeV9O4V3fCdbYnWYjmTjdB-5j_Cazd7e-icaQMX7-i_hPrcUmoY2OHs1koxcyxxgv3LlAAjnPfZrM4mf8ftrQfSkT3gO5Ct0lMV0e5bFuLFxiyX27FQI2YK8W2C6zDEdJcNcdwKcHxZJ4LCK4SipGrncT4yVdEkcBbKfs6CwEBzY4VZk4PNmy8D0dlB6nIetxwFlIU7MHnGc5N-f1hWiyM-9mjmBAs"
            alt="AI Writing visualization"
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

const DashboardPreview = () => (
  <section className="py-24 px-6 max-w-7xl mx-auto">
    <Card className="flex flex-col md:flex-row overflow-hidden shadow-2xl min-h-[600px]">
      {/* Left: Editor List */}
      <div className="w-full md:w-2/3 p-10 bg-white border-r border-surface-container-high">
        <div className="flex items-center justify-between mb-10">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/20" />
            <div className="w-3 h-3 rounded-full bg-amber-400/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/20" />
          </div>
          <Badge className="text-outline">Document Editor</Badge>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-low border-l-4 border-primary">
            <h4 className="text-sm font-bold text-primary mb-2">
              Introduction
            </h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              In the rapidly evolving landscape of digital content, AI is no
              longer a luxury but a fundamental necessity for scale...
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-l-4 border-surface-container-high">
            <h4 className="text-sm font-bold text-on-surface mb-2">
              The Core Problem
            </h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Most writers struggle with the blank page because they lack a
              modular framework for their arguments...
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border-l-4 border-surface-container-high opacity-40">
            <h4 className="text-sm font-bold text-on-surface mb-2">
              Solution Overview
            </h4>
            <div className="h-4 w-3/4 bg-surface-container-high rounded" />
          </div>
        </div>
      </div>

      {/* Right: Metrics */}
      <div className="w-full md:w-1/3 p-10 bg-surface-container-low">
        <h3 className="font-headline font-bold text-xl mb-10">
          Content Intelligence
        </h3>
        <div className="space-y-10">
          {[
            { label: "Logical Flow", score: 94, color: "bg-primary" },
            { label: "Audience Engagement", score: 82, color: "bg-secondary" },
            {
              label: "Clarity Score",
              score: 71,
              color: "bg-tertiary-container",
            },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium">{metric.label}</span>
                <span className="text-sm font-bold">{metric.score}%</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${metric.score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${metric.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 rounded-2xl glass-card ghost-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <Badge className="text-primary bg-primary/10">AI Suggestion</Badge>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Paragraph 2 lacks a transition. Try adding "Conversely..." to bridge
            the argument.
          </p>
        </div>
      </div>
    </Card>
  </section>
);

const Features = () => {
  const features = [
    {
      title: "Strategy Selection",
      desc: "Define your persona, goal, and tone before writing a single word. Our AI adapts its entire logic engine to your specific audience profile.",
      icon: <Brain />,
      span: "md:col-span-8",
      extra: (
        <div className="grid grid-cols-2 gap-3 w-full mt-6 md:mt-0 md:w-1/2">
          {[
            "B2B Technical",
            "Direct Consumer",
            "Creative Story",
            "Thought Leadership",
          ].map((t, i) => (
            <div
              key={t}
              className={`p-4 rounded-xl bg-surface-container text-center text-[10px] font-bold ${i === 0 ? "border-2 border-primary" : "opacity-40"}`}
            >
              {t}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Paragraph Outline",
      desc: "Don't just outline sections—outline ideas. Manage your blog as a stack of modular, logical units.",
      icon: <ListOrdered />,
      span: "md:col-span-4",
    },
    {
      title: "Context-Aware Engine",
      desc: "Our AI remembers what you wrote in Paragraph 1 when drafting Paragraph 10. True thematic consistency.",
      icon: <Zap />,
      span: "md:col-span-4",
    },
    {
      title: "Quality Scoring",
      desc: "Real-time metrics for clarity, logic, and intent fit. Know exactly when your draft is ready to ship.",
      icon: <BarChart3 />,
      span: "md:col-span-4",
    },
    {
      title: "Targeted Rewrite",
      desc: "A/B test different versions of the same paragraph. See the 'diff' and choose the strongest impact.",
      icon: <HistoryIcon />,
      span: "md:col-span-4",
    },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-headline text-4xl font-bold mb-4">
            Crafting Excellence
          </h2>
          <p className="text-on-surface-variant">
            The tools you need to build high-converting, logical narratives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((f, i) => (
            <Card
              key={i}
              className={`${f.span} p-8 flex flex-col ${f.extra ? "md:flex-row items-center gap-10" : ""}`}
            >
              <div className={f.extra ? "md:w-1/2" : ""}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {f.desc}
                </p>
              </div>
              {f.extra}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const Workflow = () => {
  const steps = [
    { name: "Input", sub: "Core concept" },
    { name: "Strategy", sub: "Target audience" },
    { name: "Outline", sub: "Logical units" },
    { name: "Writing", sub: "AI-guided drafting" },
    { name: "Scoring", sub: "Audit logic" },
    { name: "Rewrite", sub: "Final polish" },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="font-headline text-4xl font-bold mb-4">
          The Smart Workflow
        </h2>
        <p className="text-on-surface-variant mb-20">
          From initial spark to polished publication in 6 guided steps.
        </p>

        <div className="relative">
          <div className="absolute top-6 left-0 w-full h-0.5 bg-linear-to-r from-primary/5 via-primary/20 to-primary/5 hidden md:block" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4 shadow-lg">
                  {i + 1}
                </div>
                <span className="font-bold text-sm">{step.name}</span>
                <span className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-wider">
                  {step.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const EditorDemo = () => {
  const [outline] = useState([
    {
      title: "Hook & Premise",
      desc: "Establish the stakes of AI content saturation.",
      checked: true,
    },
    {
      title: 'The "Linear Fallacy"',
      desc: "Explain why standard drafting tools fail.",
      checked: true,
    },
    {
      title: "Modular Writing Benefits",
      desc: "Introduce the BlogCraft methodology.",
      checked: false,
    },
    {
      title: "Implementation Guide",
      desc: "Steps to integrate into existing teams.",
      checked: false,
      disabled: true,
    },
  ]);

  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <Card className="flex flex-col lg:flex-row shadow-xl overflow-hidden min-h-[700px]">
          {/* Left: Outline */}
          <div className="w-full lg:w-1/3 p-10 bg-surface-container-low border-r border-surface-container-high">
            <h4 className="font-headline font-bold text-xl mb-10">
              Paragraph Outline
            </h4>
            <div className="space-y-4">
              {outline.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm transition-all ${item.checked ? "border border-primary/20" : ""} ${item.disabled ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    readOnly
                    className="mt-1 rounded text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-sm block">
                      {item.title}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="w-full lg:w-2/3 p-12 relative bg-white">
            <div className="flex items-center justify-between mb-10 border-b border-surface-container-high pb-6">
              <div className="flex gap-6 text-outline">
                <Bold className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                <Italic className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                <Link2 className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                <ImageIcon className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
              </div>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-bold text-primary"
              >
                Auto-saving...
              </motion.span>
            </div>

            <article className="prose max-w-none">
              <h2 className="font-headline text-4xl font-bold mb-8">
                The Future of Content is Modular
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8">
                Traditional drafting methods are linear by design. You start at
                the beginning and hope the logical threads maintain their
                tension until the end. But in an era where attention spans are
                measured in milliseconds, every paragraph must stand as its own
                authoritative unit.
              </p>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8">
                This is where{" "}
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                  Modular Thought Design
                </span>{" "}
                comes in. By treating each paragraph as a strategic asset,
                writers can ensure that their overarching strategy is
                distributed evenly throughout the piece, rather than clustered
                in the introduction.
              </p>
              <div className="space-y-4 opacity-20">
                <div className="h-4 w-full bg-surface-container-high rounded" />
                <div className="h-4 w-5/6 bg-surface-container-high rounded" />
              </div>
            </article>

            {/* Floating Metrics */}
            <div className="absolute bottom-10 right-10 flex flex-col gap-4">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="glass-card ghost-border p-4 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-secondary min-w-[180px]"
              >
                <div className="bg-secondary/10 p-2 rounded-xl text-secondary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-label text-outline uppercase font-bold">
                    Audience Fit
                  </div>
                  <div className="text-xl font-bold">92%</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card ghost-border p-4 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-primary min-w-[180px]"
              >
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-label text-outline uppercase font-bold">
                    Clarity
                  </div>
                  <div className="text-xl font-bold">88%</div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-16 px-6 bg-white border-t border-surface-container-high">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-2xl font-headline font-extrabold tracking-tighter">
          BlogCraft AI
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {[
            "Privacy Policy",
            "Terms of Service",
            "Cookie Policy",
            "Contact",
          ].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="text-sm text-outline">
          © 2026 BlogCraft AI. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

const FinalCTA = () => (
  <section className="py-24 px-6">
    <div className="max-w-4xl mx-auto text-center bg-linear-to-br from-primary to-secondary p-16 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

      <h2 className="font-headline text-4xl font-bold text-white mb-6 relative z-10">
        Ready to write with clarity?
      </h2>
      <p className="text-white/80 text-xl mb-10 relative z-10">
        Join 5,000+ writers who build their authority one paragraph at a time.
      </p>
      <button className="bg-white text-primary px-10 py-4 rounded-xl font-headline font-bold text-lg shadow-lg hover:scale-105 transition-transform relative z-10">
        Get Started for Free
      </button>
    </div>
  </section>
);

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar onStart={() => navigate("/generator")} />
              <Hero onStart={() => navigate("/generator")} />
              <DashboardPreview />
              <Features />
              <Workflow />
              <EditorDemo />
              <FinalCTA />
              <Footer />
            </>
          }
        />
        <Route
          path="/generator/*"
          element={
            <>
              <Navbar onStart={() => navigate("/generator")} />
              <Generator />
            </>
          }
        />
      </Routes>
    </div>
  );
}
