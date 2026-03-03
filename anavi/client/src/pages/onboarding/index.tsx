import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useDemoContext } from "@/contexts/DemoContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import FVMCelebration from "@/components/FVMCelebration";
import { CustodyReceipt as CustodyReceiptModal } from "@/components/CustodyReceipt";
import { type Persona } from "./types";
import { PERSONAS, STEPS, loadProgress, saveProgress } from "./constants";
import { BenefitCard } from "./FormPrimitives";
import {
  ProgressBar,
  IdentityStep,
  DashboardIntroStep,
  MarketDepthStep,
  BlindMatchingIntroStep,
} from "./SharedSteps";
import {
  OriginatorBusinessStep,
  OriginatorRelationshipStep,
  OriginatorUpgradeStep,
} from "./OriginatorSteps";
import {
  InvestorProfileStep,
  InvestorKYCStep,
  IntentCreationStep,
} from "./InvestorSteps";
import {
  DeveloperProjectStep,
  DeveloperVerificationStep,
} from "./DeveloperSteps";
import {
  AllocatorFundStep,
  AllocatorComplianceStep,
  PipelinePreviewStep,
} from "./AllocatorSteps";
import {
  AcquirerProfileStep,
  AcquirerDDStep,
} from "./AcquirerSteps";

export default function OnboardingFlow() {
  const [, navigate] = useLocation();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showFVM, setShowFVM] = useState(false);
  const [showInlineReceipt, setShowInlineReceipt] = useState(false);
  const [showIntentResult, setShowIntentResult] = useState(false);
  const [custodyReceiptPayload, setCustodyReceiptPayload] = useState<{
    relationshipName: string;
    timestamp: string;
    hash: string;
    trustDelta: number;
  } | null>(null);

  useEffect(() => {
    document.title = "Onboarding | ANAVI";
  }, []);

  // Restore progress
  useEffect(() => {
    const saved = loadProgress();
    if (saved.persona) {
      setPersona(saved.persona);
      setStep(saved.step);
      setFormData(saved.formData);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    saveProgress(persona, step, formData);
  }, [persona, step, formData]);

  const { isDemo } = useDemoContext();

  const set = useCallback(
    (key: string, value: unknown) =>
      setFormData(prev => ({ ...prev, [key]: value })),
    []
  );

  // In demo mode the user hasn't authenticated, so navigating to /dashboard
  // would break out of the demo context and show an empty authenticated screen.
  // Guard the navigation so it is a no-op when isDemo is true.
  const goToDashboard = useCallback(() => {
    if (!isDemo) navigate("/dashboard");
  }, [navigate, isDemo]);

  const steps = persona ? STEPS[persona] : [];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    // FVM triggers
    if (persona === "originator" && step === 2 && !showInlineReceipt) {
      setShowInlineReceipt(true);
      setCustodyReceiptPayload({
        relationshipName: (formData.relType as string)
          ? `${formData.relType as string} Relationship`
          : "New Relationship",
        timestamp: new Date().toISOString(),
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        trustDelta: 12,
      });
      setShowFVM(true);
      return;
    }
    if (
      ((persona === "investor" || persona === "allocator") &&
        step === 3 &&
        !showIntentResult) ||
      ((persona === "developer" || persona === "acquirer") &&
        step === 3 &&
        !showIntentResult)
    ) {
      setShowIntentResult(true);
      return;
    }

    if (!isLastStep) {
      setStep(s => s + 1);
      setShowInlineReceipt(false);
      setShowIntentResult(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      setShowInlineReceipt(false);
      setShowIntentResult(false);
    } else {
      setPersona(null);
      setStep(0);
    }
  };

  // Render step content based on persona + step index
  function renderStepContent(): ReactNode {
    if (!persona) return null;

    // Step 0 is always Identity
    if (step === 0) return <IdentityStep formData={formData} set={set} />;

    switch (persona) {
      case "originator":
        if (step === 1)
          return <OriginatorBusinessStep formData={formData} set={set} />;
        if (step === 2)
          return (
            <OriginatorRelationshipStep
              formData={formData}
              set={set}
              showInlineReceipt={showInlineReceipt}
            />
          );
        if (step === 3) return <OriginatorUpgradeStep />;
        if (step === 4) return <DashboardIntroStep onGo={goToDashboard} />;
        break;
      case "investor":
        if (step === 1)
          return <InvestorProfileStep formData={formData} set={set} />;
        if (step === 2)
          return <InvestorKYCStep formData={formData} set={set} />;
        if (step === 3)
          return (
            <IntentCreationStep
              formData={formData}
              set={set}
              intentType="invest"
              showResult={showIntentResult}
            />
          );
        if (step === 4) return <MarketDepthStep onGo={goToDashboard} />;
        break;
      case "developer":
        if (step === 1)
          return <DeveloperProjectStep formData={formData} set={set} />;
        if (step === 2) return <DeveloperVerificationStep />;
        if (step === 3)
          return (
            <IntentCreationStep
              formData={formData}
              set={set}
              intentType="seek_investment"
              showResult={showIntentResult}
            />
          );
        if (step === 4) return <BlindMatchingIntroStep onGo={goToDashboard} />;
        break;
      case "allocator":
        if (step === 1)
          return <AllocatorFundStep formData={formData} set={set} />;
        if (step === 2)
          return <AllocatorComplianceStep formData={formData} set={set} />;
        if (step === 3)
          return (
            <IntentCreationStep
              formData={formData}
              set={set}
              intentType="allocate"
              showResult={showIntentResult}
            />
          );
        if (step === 4)
          return (
            <PipelinePreviewStep
              onGo={goToDashboard}
              label="Institutional pipeline matching your mandate:"
            />
          );
        break;
      case "acquirer":
        if (step === 1)
          return <AcquirerProfileStep formData={formData} set={set} />;
        if (step === 2) return <AcquirerDDStep formData={formData} set={set} />;
        if (step === 3)
          return (
            <IntentCreationStep
              formData={formData}
              set={set}
              intentType="acquire"
              showResult={showIntentResult}
            />
          );
        if (step === 4)
          return (
            <PipelinePreviewStep
              onGo={goToDashboard}
              label="Acquisition targets matching your criteria:"
            />
          );
        break;
    }
    return null;
  }

  // ---- PERSONA SELECTION (Step 0 / The Fork) ----
  if (!persona) {
    return (
      <div className="min-h-screen bg-mesh">
        {/* Navy header */}
        <header className="glass-dark sticky top-0 z-20 px-6 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">@</span>
              <span className="text-2xl font-bold text-white">navi</span>
              <span className="ml-1 h-2 w-2 rounded-full bg-[#22D4F5] animate-glow-pulse" />
            </div>
            <p className="mt-1 text-sm text-white/50">
              Private Market Operating System
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            My primary role is...
          </h1>
          <p className="mb-10 text-center text-sm text-white/50">
            Select the role that best describes how you operate in private
            markets.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPersona(p.id);
                  setStep(0);
                  setFormData({});
                  setShowInlineReceipt(false);
                  setShowIntentResult(false);
                }}
                className="hover-lift group cursor-pointer glass-dark rounded-xl p-6 text-left border-0 hover:bg-white/[0.08] transition-all duration-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#22D4F5]/10 transition group-hover:bg-[#22D4F5]/15">
                  <p.icon className="h-6 w-6 text-[#22D4F5]" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-white">
                  {p.label}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ---- WIZARD ----
  const currentStepDef = steps[step];
  const showNavButtons =
    step < steps.length - 1 ||
    (step === steps.length - 1 &&
      !["originator"].includes(persona) &&
      step !== 4);
  const hideNextOnFinal = isLastStep;

  return (
    <div className="min-h-screen bg-canvas-void">
      {/* Cinematic progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-white/5">
        <motion.div
          className="h-full bg-[#22D4F5]"
          style={{ boxShadow: "0 0 8px oklch(0.75 0.18 200 / 0.60)" }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {/* FVM celebration overlay */}
      {showFVM && (
        <FVMCelebration
          title="Relationship Custodied"
          subtitle="Your first relationship is now cryptographically timestamped and protected on ANAVI."
          ctaLabel="Continue Setup"
          onCta={() => setShowFVM(false)}
          icon={<Lock className="h-8 w-8 text-[#059669]" />}
        />
      )}

      {/* Full-screen custody receipt — fires after FVM dismisses */}
      <AnimatePresence>
        {!showFVM && custodyReceiptPayload && (
          <CustodyReceiptModal
            {...custodyReceiptPayload}
            onContinue={() => {
              setCustodyReceiptPayload(null);
              setStep(s => s + 1);
              setShowInlineReceipt(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-dark sticky top-0 z-20 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">@</span>
            <span className="text-xl font-bold text-white">navi</span>
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            {PERSONAS.find(p => p.id === persona)?.label}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <ProgressBar steps={steps} current={step} />

        <div className="glass-dark rounded-2xl p-8">
          <h2 className="mb-1 text-xl font-bold text-white">
            {currentStepDef.name}
          </h2>
          <p className="mb-4 text-xs text-white/40">
            ~{currentStepDef.minutes} min
          </p>

          <BenefitCard text={currentStepDef.benefit} />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${persona}-${step}`}
              initial={{ opacity: 0, x: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {!hideNextOnFinal && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleNext}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#C4972A] px-6 py-2.5 text-sm font-medium text-[#060A12] transition hover:bg-[#D4A73A]"
              >
                {persona === "originator" && step === 2 && !showInlineReceipt
                  ? "Secure Relationship"
                  : step === 3 && !showIntentResult && persona !== "originator"
                    ? "Create Intent"
                    : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Back-only on final steps that have their own CTA */}
          {hideNextOnFinal && (
            <div className="mt-8">
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>
          )}

          {/* Skip for originator upgrade step */}
          {persona === "originator" && step === 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleNext}
                className="cursor-pointer text-sm text-white/30 underline transition hover:text-white/50"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}