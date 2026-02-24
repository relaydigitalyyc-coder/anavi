import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, FileText, Users, DollarSign, Shield, 
  CheckCircle2, Clock, AlertCircle, Send, Building2,
  Target, Globe, Calendar
} from "lucide-react";
import { toast } from "sonner";

const ASSET_CLASSES = [
  "Real Estate",
  "Private Equity",
  "Venture Capital",
  "Commodities",
  "Infrastructure",
  "Private Credit",
  "Hedge Fund",
  "Other",
];

const RAISE_RANGES = [
  "$1M - $5M",
  "$5M - $15M",
  "$15M - $50M",
  "$50M - $100M",
  "$100M+",
];

export default function OperatorIntake() {
  const [formData, setFormData] = useState({
    // Operator Info
    operatorName: "",
    companyName: "",
    email: "",
    phone: "",
    linkedIn: "",
    
    // Deal Info
    dealTitle: "",
    assetClass: "",
    geography: "",
    targetRaise: "",
    minimumInvestment: "",
    
    // Details
    investmentThesis: "",
    trackRecord: "",
    skinInGame: "",
    timeline: "",
    
    // Acknowledgments
    accreditedOnly: false,
    manualReview: false,
    noAutomation: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast.success("Submission Received", {
      description: "Our team will review your submission and reach out within 5-7 business days.",
    });
  };

  if (isSubmitted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Submission Received</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in partnering with NAVI. Our team will manually review your submission and reach out within 5-7 business days.
            </p>
            <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20 text-left">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-sky-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sky-600">Manual Review Only</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every submission is personally reviewed by our team. We don't use automated screening—quality and alignment matter more than speed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Badge variant="outline" className="text-xs">For Operators</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Submit a Deal</h1>
          <p className="text-muted-foreground">
            Share your opportunity with our network of aligned investors. All submissions are manually reviewed—no automation, no algorithms.
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-sky-500/5 border-sky-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-sky-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">What to Expect</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Every submission is personally reviewed by our team</li>
                    <li>• We respond to all submissions within 5-7 business days</li>
                    <li>• We only accept deals where we can add value beyond capital</li>
                    <li>• Operators must have meaningful skin in the game</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Operator Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-500" />
                Operator Information
              </CardTitle>
              <CardDescription>Tell us about yourself and your firm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operatorName">Your Name *</Label>
                  <Input
                    id="operatorName"
                    placeholder="Full name"
                    value={formData.operatorName}
                    onChange={(e) => updateFormData("operatorName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company / Fund Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Your firm or fund"
                    value={formData.companyName}
                    onChange={(e) => updateFormData("companyName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                <Input
                  id="linkedIn"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedIn}
                  onChange={(e) => updateFormData("linkedIn", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Deal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-sky-500" />
                Deal Information
              </CardTitle>
              <CardDescription>Basic details about the opportunity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dealTitle">Deal Title *</Label>
                <Input
                  id="dealTitle"
                  placeholder="e.g., Series B - Enterprise SaaS Platform"
                  value={formData.dealTitle}
                  onChange={(e) => updateFormData("dealTitle", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Class *</Label>
                  <Select value={formData.assetClass} onValueChange={(v) => updateFormData("assetClass", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset class" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CLASSES.map((ac) => (
                        <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geography">Geography *</Label>
                  <Input
                    id="geography"
                    placeholder="e.g., United States, Global"
                    value={formData.geography}
                    onChange={(e) => updateFormData("geography", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Raise *</Label>
                  <Select value={formData.targetRaise} onValueChange={(v) => updateFormData("targetRaise", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAISE_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumInvestment">Minimum Investment</Label>
                  <Input
                    id="minimumInvestment"
                    placeholder="e.g., $100,000"
                    value={formData.minimumInvestment}
                    onChange={(e) => updateFormData("minimumInvestment", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" />
                Deal Details
              </CardTitle>
              <CardDescription>Help us understand the opportunity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investmentThesis">Investment Thesis *</Label>
                <Textarea
                  id="investmentThesis"
                  placeholder="What is the core investment thesis? Why is this opportunity compelling?"
                  value={formData.investmentThesis}
                  onChange={(e) => updateFormData("investmentThesis", e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackRecord">Your Track Record *</Label>
                <Textarea
                  id="trackRecord"
                  placeholder="What is your relevant experience? Prior exits, returns, or operational experience?"
                  value={formData.trackRecord}
                  onChange={(e) => updateFormData("trackRecord", e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skinInGame">Skin in the Game *</Label>
                <Textarea
                  id="skinInGame"
                  placeholder="How much of your own capital are you investing? What percentage of the raise?"
                  value={formData.skinInGame}
                  onChange={(e) => updateFormData("skinInGame", e.target.value)}
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., Targeting close by Q2 2026"
                  value={formData.timeline}
                  onChange={(e) => updateFormData("timeline", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-500" />
                Acknowledgments
              </CardTitle>
              <CardDescription>Please confirm you understand our process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accreditedOnly"
                  checked={formData.accreditedOnly}
                  onCheckedChange={(checked) => updateFormData("accreditedOnly", checked as boolean)}
                  required
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="accreditedOnly" className="text-sm font-medium cursor-pointer">
                    Accredited Investors Only *
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I understand that NAVI only works with accredited investors and qualified purchasers.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="manualReview"
                  checked={formData.manualReview}
                  onCheckedChange={(checked) => updateFormData("manualReview", checked as boolean)}
                  required
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="manualReview" className="text-sm font-medium cursor-pointer">
                    Manual Review Process *
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I understand that all submissions are manually reviewed and there is no guarantee of acceptance.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="noAutomation"
                  checked={formData.noAutomation}
                  onCheckedChange={(checked) => updateFormData("noAutomation", checked as boolean)}
                  required
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="noAutomation" className="text-sm font-medium cursor-pointer">
                    No Automation Promises *
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I understand that NAVI does not guarantee capital raising and makes no promises about timeline or outcomes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full bg-sky-500 hover:bg-sky-600 h-12"
            disabled={isSubmitting || !formData.accreditedOnly || !formData.manualReview || !formData.noAutomation}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
