import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, FileText, Users, DollarSign, Shield, CheckCircle2,
  ArrowRight, ArrowLeft, Briefcase, Scale, Calendar, Percent,
  AlertCircle, Sparkles, Target, Globe
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const STEPS = [
  { id: 1, title: "Entity Setup", icon: Building2, description: "Legal structure and jurisdiction" },
  { id: 2, title: "Investment Details", icon: Target, description: "Purpose and asset class" },
  { id: 3, title: "Capital Structure", icon: DollarSign, description: "Raise targets and minimums" },
  { id: 4, title: "Fee Structure", icon: Percent, description: "Management and carry terms" },
  { id: 5, title: "Timeline", icon: Calendar, description: "Key dates and deadlines" },
  { id: 6, title: "Review & Launch", icon: CheckCircle2, description: "Confirm and create SPV" },
];

const ENTITY_TYPES = [
  { value: "llc", label: "LLC", description: "Limited Liability Company - Most common for US SPVs" },
  { value: "lp", label: "LP", description: "Limited Partnership - Traditional fund structure" },
  { value: "series_llc", label: "Series LLC", description: "Multiple segregated series under one entity" },
  { value: "corp", label: "Corporation", description: "C-Corp or S-Corp structure" },
  { value: "trust", label: "Trust", description: "Trust-based vehicle" },
  { value: "offshore", label: "Offshore", description: "Cayman, BVI, or other offshore jurisdiction" },
];

const ASSET_CLASSES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "private_equity", label: "Private Equity" },
  { value: "venture_capital", label: "Venture Capital" },
  { value: "hedge_fund", label: "Hedge Fund" },
  { value: "commodities", label: "Commodities" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "debt", label: "Debt/Credit" },
  { value: "mixed", label: "Mixed/Multi-Asset" },
];

const JURISDICTIONS = [
  "Delaware", "Wyoming", "Nevada", "New York", "California", "Texas",
  "Cayman Islands", "British Virgin Islands", "Luxembourg", "Ireland"
];

export default function SPVGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Entity Setup
    name: "",
    legalName: "",
    entityType: "llc",
    jurisdiction: "Delaware",
    description: "",
    
    // Step 2: Investment Details
    investmentPurpose: "",
    targetAssetClass: "",
    targetIndustry: "",
    
    // Step 3: Capital Structure
    targetRaise: "",
    minimumInvestment: "",
    maximumInvestment: "",
    currency: "USD",
    
    // Step 4: Fee Structure
    managementFee: "2.00",
    carriedInterest: "20.00",
    preferredReturn: "8.00",
    
    // Step 5: Timeline
    fundingDeadline: "",
    investmentPeriodEnd: "",
    termEndDate: "",
  });

  const progress = (currentStep / STEPS.length) * 100;

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    toast.success("SPV Created Successfully!", {
      description: `${formData.name} has been created and is ready for LP onboarding.`,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">SPV Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Ventures SPV I"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Entity Name</Label>
                <Input
                  id="legalName"
                  placeholder="e.g., Acme Ventures SPV I, LLC"
                  value={formData.legalName}
                  onChange={(e) => updateFormData("legalName", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Entity Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {ENTITY_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => updateFormData("entityType", type.value)}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      formData.entityType === type.value
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-border hover:border-sky-500/50"
                    }`}
                  >
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select value={formData.jurisdiction} onValueChange={(v) => updateFormData("jurisdiction", v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the SPV purpose..."
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                className="bg-background min-h-[100px]"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="investmentPurpose">Investment Purpose</Label>
              <Textarea
                id="investmentPurpose"
                placeholder="Describe the investment thesis and strategy..."
                value={formData.investmentPurpose}
                onChange={(e) => updateFormData("investmentPurpose", e.target.value)}
                className="bg-background min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <Label>Target Asset Class</Label>
              <div className="grid grid-cols-4 gap-3">
                {ASSET_CLASSES.map((asset) => (
                  <div
                    key={asset.value}
                    onClick={() => updateFormData("targetAssetClass", asset.value)}
                    className={`p-4 border-2 cursor-pointer transition-all text-center ${
                      formData.targetAssetClass === asset.value
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-border hover:border-sky-500/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{asset.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetIndustry">Target Industry (Optional)</Label>
              <Input
                id="targetIndustry"
                placeholder="e.g., Technology, Healthcare, Energy"
                value={formData.targetIndustry}
                onChange={(e) => updateFormData("targetIndustry", e.target.value)}
                className="bg-background"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="targetRaise">Target Raise</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="targetRaise"
                    type="number"
                    placeholder="10,000,000"
                    value={formData.targetRaise}
                    onChange={(e) => updateFormData("targetRaise", e.target.value)}
                    className="bg-background pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => updateFormData("currency", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="minimumInvestment">Minimum Investment</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="minimumInvestment"
                    type="number"
                    placeholder="100,000"
                    value={formData.minimumInvestment}
                    onChange={(e) => updateFormData("minimumInvestment", e.target.value)}
                    className="bg-background pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumInvestment">Maximum Investment (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maximumInvestment"
                    type="number"
                    placeholder="No limit"
                    value={formData.maximumInvestment}
                    onChange={(e) => updateFormData("maximumInvestment", e.target.value)}
                    className="bg-background pl-10"
                  />
                </div>
              </div>
            </div>

            <Card className="bg-sky-500/5 border-sky-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-sky-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Accreditation Requirements</div>
                    <div className="text-sm text-muted-foreground">
                      Based on your minimum investment of ${formData.minimumInvestment || "100,000"}, 
                      LPs will need to be Accredited Investors under SEC Rule 501.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="managementFee">Management Fee (%)</Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="managementFee"
                    type="number"
                    step="0.25"
                    value={formData.managementFee}
                    onChange={(e) => updateFormData("managementFee", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Annual fee on committed capital</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carriedInterest">Carried Interest (%)</Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="carriedInterest"
                    type="number"
                    step="0.5"
                    value={formData.carriedInterest}
                    onChange={(e) => updateFormData("carriedInterest", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">GP share of profits</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredReturn">Preferred Return (%)</Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="preferredReturn"
                    type="number"
                    step="0.5"
                    value={formData.preferredReturn}
                    onChange={(e) => updateFormData("preferredReturn", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Hurdle rate before carry</p>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Fee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Management Fee</span>
                  <span className="font-semibold">{formData.managementFee}% annually</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Carried Interest</span>
                  <span className="font-semibold">{formData.carriedInterest}% of profits</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preferred Return</span>
                  <span className="font-semibold">{formData.preferredReturn}% hurdle</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="fundingDeadline">Funding Deadline</Label>
                <Input
                  id="fundingDeadline"
                  type="date"
                  value={formData.fundingDeadline}
                  onChange={(e) => updateFormData("fundingDeadline", e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Final close date</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentPeriodEnd">Investment Period End</Label>
                <Input
                  id="investmentPeriodEnd"
                  type="date"
                  value={formData.investmentPeriodEnd}
                  onChange={(e) => updateFormData("investmentPeriodEnd", e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">End of deployment period</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="termEndDate">Fund Term End</Label>
                <Input
                  id="termEndDate"
                  type="date"
                  value={formData.termEndDate}
                  onChange={(e) => updateFormData("termEndDate", e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Expected liquidation</p>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center z-10">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">SPV Formation</div>
                        <div className="text-sm text-muted-foreground">Today</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-sky-500 flex items-center justify-center z-10">
                        <span className="text-xs font-bold">1</span>
                      </div>
                      <div>
                        <div className="font-medium">Funding Deadline</div>
                        <div className="text-sm text-muted-foreground">{formData.fundingDeadline || "Not set"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center z-10">
                        <span className="text-xs font-bold">2</span>
                      </div>
                      <div>
                        <div className="font-medium">Investment Period End</div>
                        <div className="text-sm text-muted-foreground">{formData.investmentPeriodEnd || "Not set"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center z-10">
                        <span className="text-xs font-bold">3</span>
                      </div>
                      <div>
                        <div className="font-medium">Fund Term End</div>
                        <div className="text-sm text-muted-foreground">{formData.termEndDate || "Not set"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-sky-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" />
                  {formData.name || "New SPV"}
                </CardTitle>
                <CardDescription>{formData.legalName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Entity Type</div>
                    <div className="font-medium">{ENTITY_TYPES.find(t => t.value === formData.entityType)?.label}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Jurisdiction</div>
                    <div className="font-medium">{formData.jurisdiction}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Target Raise</div>
                    <div className="font-medium">${Number(formData.targetRaise || 0).toLocaleString()} {formData.currency}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Minimum Investment</div>
                    <div className="font-medium">${Number(formData.minimumInvestment || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Asset Class</div>
                    <div className="font-medium">{ASSET_CLASSES.find(a => a.value === formData.targetAssetClass)?.label || "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fee Structure</div>
                    <div className="font-medium">{formData.managementFee}% / {formData.carriedInterest}%</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="font-medium">Documents to be Generated</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Operating Agreement",
                      "Private Placement Memorandum",
                      "Subscription Agreement",
                      "Side Letter Template",
                      "Capital Call Notice Template",
                      "Distribution Notice Template",
                    ].map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-sky-500" />
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Ready to Launch</div>
                    <div className="text-sm text-muted-foreground">
                      Your SPV will be created with a dedicated deal room. You can immediately 
                      start onboarding LPs and collecting commitments.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">SPV Generator</h1>
          <p className="text-muted-foreground">
            Launch a compliant Special Purpose Vehicle in minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step.id
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      currentStep > step.id ? "bg-sky-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-center ${
                  currentStep === step.id ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
                style={{ width: `${100 / STEPS.length}%` }}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon;
                return <StepIcon className="h-5 w-5 text-sky-500" />;
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} className="gap-2 bg-sky-500 hover:bg-sky-600">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700">
              <Sparkles className="h-4 w-4" />
              Create SPV
            </Button>
          )}
        </div>
      </div>
  );
}
