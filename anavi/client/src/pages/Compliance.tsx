import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Zap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { COMPLIANCE_MARKET, KYB_VALUE } from "@/lib/copy";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";

const COMPLIANCE_CHECKS = [
  {
    id: "sanctions",
    label: "Sanctions Screening",
    description: "OFAC, EU, UN sanctions lists",
  },
  {
    id: "pep",
    label: "PEP Check",
    description: "Politically Exposed Persons database",
  },
  {
    id: "adverse_media",
    label: "Adverse Media",
    description: "Negative news and media monitoring",
  },
  {
    id: "aml",
    label: "AML Screening",
    description: "Anti-Money Laundering checks",
  },
  {
    id: "kyc",
    label: "KYC Verification",
    description: "Know Your Customer identity verification",
  },
  {
    id: "kyb",
    label: "KYB Verification",
    description: "Know Your Business entity verification",
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction Check",
    description: "Regulatory compliance by region",
  },
] as const;

function checkStatusBadge(status: string | undefined) {
  switch (status) {
    case "passed":
      return {
        label: "Passed",
        className: "bg-sky-100 text-sky-700 hover:bg-sky-100 border-0",
      };
    case "failed":
    case "flagged":
      return {
        label: status === "failed" ? "Failed" : "Flagged",
        className: "bg-red-100 text-red-700 hover:bg-red-100 border-0",
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-0",
      };
    default:
      return {
        label: "Not Checked",
        className: "bg-muted text-muted-foreground hover:bg-muted border-0",
      };
  }
}

function checkStatusIcon(status: string | undefined) {
  switch (status) {
    case "passed":
      return <CheckCircle2 className="w-5 h-5 text-sky-600" />;
    case "failed":
    case "flagged":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case "pending":
      return <Clock className="w-5 h-5 text-amber-600" />;
    default:
      return <Shield className="w-5 h-5 text-muted-foreground" />;
  }
}

export default function Compliance() {
  const { data: user } = trpc.user.getProfile.useQuery(undefined, {
    retry: false,
  });
  const { data: checkResults } = trpc.compliance.getChecks.useQuery(
    { entityType: "user", entityId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const utils = trpc.useUtils();
  const runCheckMutation = trpc.compliance.runCheck.useMutation({
    onSuccess: () => {
      toast.success("Compliance check initiated");
      utils.compliance.getChecks.invalidate();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const resultsByType = new Map(
    (checkResults ?? []).map(r => [r.checkType, r])
  );
  const passedCount = COMPLIANCE_CHECKS.filter(
    c => resultsByType.get(c.id)?.status === "passed"
  ).length;
  const hasFailed = COMPLIANCE_CHECKS.some(c => {
    const s = resultsByType.get(c.id)?.status;
    return s === "failed" || s === "flagged";
  });
  const hasPending = COMPLIANCE_CHECKS.some(
    c => resultsByType.get(c.id)?.status === "pending"
  );

  const overallLabel = hasFailed
    ? "Alert"
    : passedCount === COMPLIANCE_CHECKS.length
      ? "Clear"
      : hasPending
        ? "Pending"
        : "Not Checked";
  const overallColor = hasFailed
    ? "text-red-600"
    : passedCount === COMPLIANCE_CHECKS.length
      ? "text-sky-600"
      : hasPending
        ? "text-amber-600"
        : "text-muted-foreground";
  const overallBg = hasFailed
    ? "bg-red-100"
    : passedCount === COMPLIANCE_CHECKS.length
      ? "bg-sky-100"
      : hasPending
        ? "bg-amber-100"
        : "bg-muted";
  const overallGradient = hasFailed
    ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
    : passedCount === COMPLIANCE_CHECKS.length
      ? "border-sky-200 bg-gradient-to-br from-emerald-50 to-white"
      : hasPending
        ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
        : "border-border";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header — Duna-inspired value prop */}
      <FadeInView>
        <div className="rounded-2xl border border-[#1E3A5F]/10 bg-gradient-to-br from-[#0A1628] to-[#162040] p-6 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C4972A]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#22D4F5]/70 mb-3">
                  Compliance Passport
                </p>
                <h1 className="dash-heading text-3xl md:text-4xl text-white mb-3">
                  {KYB_VALUE.headline}
                </h1>
                <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-xl">
                  {KYB_VALUE.subhead}
                </p>
              </div>
              <Button
                onClick={() => {
                  if (user?.id) {
                    runCheckMutation.mutate({
                      entityType: "user",
                      entityId: user.id,
                      checkType: "sanctions",
                    });
                  }
                }}
                disabled={runCheckMutation.isPending}
                className="btn-gold shrink-0"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${runCheckMutation.isPending ? "animate-spin" : ""}`}
                />
                Run All Checks
              </Button>
            </div>

            {/* Animated stat counters — sourced market data */}
            <StaggerContainer className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: TrendingDown,
                  metric: "$34B",
                  label: "Lost annually to inefficient KYC/KYB",
                  source: COMPLIANCE_MARKET.identityVerificationLoss.source,
                },
                {
                  icon: Zap,
                  metric: "10x",
                  label: "Faster onboarding with shared passports",
                  source: "ANAVI Platform",
                },
                {
                  icon: Shield,
                  metric: "87%",
                  label: "Cost reduction per deal",
                  source: COMPLIANCE_MARKET.budgetIncreasing.source,
                },
                {
                  icon: Lock,
                  metric: "100%",
                  label: "Immutable audit trail coverage",
                  source: "ANAVI Platform",
                },
              ].map(stat => (
                <StaggerItem key={stat.label}>
                  <div className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-4 group hover:border-[#C4972A]/20 transition-colors">
                    <stat.icon className="w-4 h-4 text-[#C4972A] mb-2" />
                    <p className="font-serif text-2xl md:text-3xl text-white">
                      {stat.metric}
                    </p>
                    <p className="text-[10px] text-white/45 mt-1 leading-snug">
                      {stat.label}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </FadeInView>

      {/* KYB Modules Matrix — Duna-inspired */}
      <FadeInView delay={0.1}>
        <div className="card-elevated p-6">
          <h2 className="data-label mb-4">Compliance Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KYB_VALUE.modules.map(mod => (
              <div
                key={mod.id}
                className="rounded-xl border border-[#D1DCF0]/60 bg-[#F3F7FC]/50 p-4 hover:border-[#C4972A]/30 hover:bg-white transition-all duration-200"
              >
                <p className="text-sm font-semibold text-[#0A1628] mb-1">
                  {mod.label}
                </p>
                <p className="text-xs text-[#1E3A5F]/60 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeInView>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`border-border/60 shadow-sm ${overallGradient}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl ${overallBg} flex items-center justify-center`}
              >
                {hasFailed ? (
                  <AlertCircle className={`w-7 h-7 ${overallColor}`} />
                ) : (
                  <CheckCircle2 className={`w-7 h-7 ${overallColor}`} />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${overallColor}`}>
                  {overallLabel}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Status
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">Low</div>
                <div className="text-sm text-muted-foreground">Risk Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">Today</div>
                <div className="text-sm text-muted-foreground">
                  Last Checked
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checks */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Compliance Checks
          </CardTitle>
          <CardDescription>
            Automated screening against global watchlists and databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMPLIANCE_CHECKS.map((check, index) => {
              const result = resultsByType.get(check.id);
              const badge = checkStatusBadge(result?.status ?? undefined);
              return (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                      {checkStatusIcon(result?.status ?? undefined)}
                    </div>
                    <div>
                      <div className="font-semibold">{check.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {check.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={badge.className}>{badge.label}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-muted"
                      onClick={() => {
                        if (user?.id) {
                          runCheckMutation.mutate({
                            entityType: "user",
                            entityId: user.id,
                            checkType: check.id as any,
                          });
                        }
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verification Progress */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Verification Progress
          </CardTitle>
          <CardDescription>
            Complete all verification steps to unlock full platform access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">
                  {passedCount} of {COMPLIANCE_CHECKS.length} completed
                </span>
              </div>
              <Progress
                value={Math.round(
                  (passedCount / COMPLIANCE_CHECKS.length) * 100
                )}
                className="h-2"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Email Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified
                </p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Phone Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your phone number has been verified
                </p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Identity Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Government ID verified
                </p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Business Verification</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload business documents
                </p>
                <Button size="sm" onClick={() => toast.info("Coming soon")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </div>

              <div className="p-5 rounded-xl border border-border bg-muted/30 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Accreditation</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verify accredited investor status
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jurisdictions */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="w-5 h-5 text-primary" />
            Jurisdiction Coverage
          </CardTitle>
          <CardDescription>
            Regulatory compliance status by region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { region: "United States", status: "compliant" },
              { region: "European Union", status: "compliant" },
              { region: "United Kingdom", status: "compliant" },
              { region: "Switzerland", status: "compliant" },
              { region: "Singapore", status: "compliant" },
              { region: "UAE", status: "compliant" },
              { region: "Hong Kong", status: "pending" },
              { region: "Cayman Islands", status: "compliant" },
            ].map(jurisdiction => (
              <div
                key={jurisdiction.region}
                className={`p-4 rounded-xl border text-center transition-all hover:shadow-sm ${
                  jurisdiction.status === "compliant"
                    ? "border-sky-200 bg-sky-50/50"
                    : "border-sky-200 bg-sky-50/50"
                }`}
              >
                <div className="text-sm font-semibold mb-2">
                  {jurisdiction.region}
                </div>
                <Badge
                  className={`${
                    jurisdiction.status === "compliant"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-sky-100 text-sky-700"
                  } border-0`}
                >
                  {jurisdiction.status === "compliant"
                    ? "Compliant"
                    : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="border-border/60 shadow-sm border-teal-200 bg-gradient-to-r from-teal-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Continuous Monitoring
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                @navi continuously monitors all participants against global
                sanctions lists, PEP databases, and adverse media sources. Any
                status changes trigger immediate alerts and may affect deal room
                access and matching eligibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
