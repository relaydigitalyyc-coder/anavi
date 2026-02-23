import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, CheckCircle2, Clock, 
  FileText, Globe, RefreshCw, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const COMPLIANCE_CHECKS = [
  { id: "sanctions", label: "Sanctions Screening", description: "OFAC, EU, UN sanctions lists" },
  { id: "pep", label: "PEP Check", description: "Politically Exposed Persons database" },
  { id: "adverse_media", label: "Adverse Media", description: "Negative news and media monitoring" },
  { id: "aml", label: "AML Screening", description: "Anti-Money Laundering checks" },
  { id: "kyc", label: "KYC Verification", description: "Know Your Customer identity verification" },
  { id: "kyb", label: "KYB Verification", description: "Know Your Business entity verification" },
  { id: "jurisdiction", label: "Jurisdiction Check", description: "Regulatory compliance by region" },
];

export default function Compliance() {
  const { data: user } = trpc.user.getProfile.useQuery();
  
  const runCheckMutation = trpc.compliance.runCheck.useMutation({
    onSuccess: () => {
      toast.success("Compliance check initiated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            Compliance Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time sanctions screening and regulatory compliance
          </p>
        </div>
        <Button
          onClick={() => {
            if (user?.id) {
              runCheckMutation.mutate({
                entityType: 'user',
                entityId: user.id,
                checkType: 'sanctions',
              });
            }
          }}
          disabled={runCheckMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${runCheckMutation.isPending ? 'animate-spin' : ''}`} />
          Run All Checks
        </Button>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 shadow-sm border-sky-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-sky-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-600">Clear</div>
                <div className="text-sm text-muted-foreground">Overall Status</div>
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
                <div className="text-sm text-muted-foreground">Last Checked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checks */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Compliance Checks</CardTitle>
          <CardDescription>
            Automated screening against global watchlists and databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMPLIANCE_CHECKS.map((check, index) => (
              <div
                key={check.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <div className="font-semibold">{check.label}</div>
                    <div className="text-sm text-muted-foreground">{check.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-0">Passed</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                    onClick={() => {
                      if (user?.id) {
                        runCheckMutation.mutate({
                          entityType: 'user',
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Progress */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Verification Progress</CardTitle>
          <CardDescription>
            Complete all verification steps to unlock full platform access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">3 of 5 completed</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Email Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">Your email has been verified</p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Phone Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">Your phone number has been verified</p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Identity Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">Government ID verified</p>
              </div>

              <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold">Business Verification</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Upload business documents</p>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </div>

              <div className="p-5 rounded-xl border border-border bg-muted/30 opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Accreditation</span>
                </div>
                <p className="text-sm text-muted-foreground">Verify accredited investor status</p>
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
            ].map((jurisdiction) => (
              <div
                key={jurisdiction.region}
                className={`p-4 rounded-xl border text-center transition-all hover:shadow-sm ${
                  jurisdiction.status === 'compliant' 
                    ? 'border-sky-200 bg-sky-50/50' 
                    : 'border-sky-200 bg-sky-50/50'
                }`}
              >
                <div className="text-sm font-semibold mb-2">{jurisdiction.region}</div>
                <Badge className={`${
                  jurisdiction.status === 'compliant' 
                    ? 'bg-sky-100 text-sky-700' 
                    : 'bg-sky-100 text-sky-700'
                } border-0`}>
                  {jurisdiction.status === 'compliant' ? 'Compliant' : 'Pending'}
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
              <h3 className="font-semibold text-lg mb-2">Continuous Monitoring</h3>
              <p className="text-muted-foreground leading-relaxed">
                @navi continuously monitors all participants against global sanctions lists, PEP databases, 
                and adverse media sources. Any status changes trigger immediate alerts and may affect 
                deal room access and matching eligibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
