import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  User, Shield, Bell, Key, 
  Upload, CheckCircle2, Clock, Save
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: user, refetch } = trpc.user.getProfile.useQuery();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    company: user?.company || "",
    title: user?.title || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profile);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, verification, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Key className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
              <CardDescription>
                Update your profile information visible to verified counterparties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="John Doe"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Job Title</Label>
                  <Input
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    placeholder="Managing Director"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Company</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Acme Capital"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="New York, NY"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Website</Label>
                <Input
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others about yourself and your expertise..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Contact Handles</CardTitle>
              <CardDescription>
                Add your communication channels for verified connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { platform: "Email", icon: "📧", placeholder: "john@example.com" },
                  { platform: "Phone", icon: "📱", placeholder: "+1 (555) 123-4567" },
                  { platform: "LinkedIn", icon: "💼", placeholder: "linkedin.com/in/johndoe" },
                  { platform: "Telegram", icon: "✈️", placeholder: "@johndoe" },
                  { platform: "WhatsApp", icon: "💬", placeholder: "+1 (555) 123-4567" },
                  { platform: "Discord", icon: "🎮", placeholder: "johndoe#1234" },
                ].map((handle) => (
                  <div key={handle.platform} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <span className="text-xl">{handle.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">{handle.platform}</div>
                      <Input
                        className="h-9"
                        placeholder={handle.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4" variant="outline">
                Add More Handles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Verification Status</CardTitle>
              <CardDescription>
                Complete verification to unlock full platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {user?.verificationTier === 'none' ? 'Unverified' : 
                       user?.verificationTier === 'basic' ? 'Basic' :
                       user?.verificationTier === 'enhanced' ? 'Enhanced' : 'Institutional'}
                    </span>
                    <Badge className="capitalize">
                      {user?.verificationTier || 'none'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Trust Score: <span className="font-semibold text-primary">{user?.trustScore || 0}/100</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    tier: "Basic", 
                    status: "available",
                    requirements: ["Email verification", "Phone verification", "Profile completion"],
                    benefits: ["Post intents", "View matches", "Basic messaging"]
                  },
                  { 
                    tier: "Enhanced", 
                    status: "locked",
                    requirements: ["Government ID", "Proof of address", "LinkedIn verification"],
                    benefits: ["Create deal rooms", "Access compliance tools", "Priority matching"]
                  },
                  { 
                    tier: "Institutional", 
                    status: "locked",
                    requirements: ["Business registration", "Accredited investor proof", "AML/KYC completion"],
                    benefits: ["Full platform access", "API access", "White-glove support"]
                  },
                ].map((level) => (
                  <div
                    key={level.tier}
                    className={`p-5 rounded-xl border transition-all ${
                      level.status === 'available' 
                        ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-amber-500/5' 
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{level.tier} Verification</span>
                        {level.status === 'available' ? (
                          <Badge className="bg-sky-100 text-sky-700 border-0">Available</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className={level.status === 'available' ? 'bg-primary text-primary-foreground' : ''}
                        variant={level.status === 'available' ? 'default' : 'outline'}
                        disabled={level.status === 'locked'}
                      >
                        {level.status === 'available' ? 'Start Verification' : 'Complete Previous'}
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-2 font-medium">Requirements:</div>
                        <ul className="space-y-2">
                          {level.requirements.map((req, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-2 font-medium">Benefits:</div>
                        <ul className="space-y-2">
                          {level.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-sky-600" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Upload Documents</CardTitle>
              <CardDescription>
                Submit verification documents securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: "Government ID", description: "Passport, Driver's License, or National ID" },
                  { name: "Proof of Address", description: "Utility bill or bank statement (< 3 months)" },
                  { name: "Business Registration", description: "Certificate of incorporation" },
                  { name: "Accreditation Proof", description: "Letter from CPA, broker, or attorney" },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className="p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">{doc.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "New Matches", description: "When AI finds compatible counterparties" },
                  { name: "Deal Updates", description: "Stage changes and milestone completions" },
                  { name: "Messages", description: "New messages from verified contacts" },
                  { name: "Compliance Alerts", description: "Important compliance notifications" },
                  { name: "Payout Notifications", description: "When payouts are processed" },
                  { name: "Weekly Digest", description: "Summary of your network activity" },
                ].map((notification, index) => (
                  <div
                    key={notification.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <div className="font-semibold">{notification.name}</div>
                      <div className="text-sm text-muted-foreground">{notification.description}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked id={`${notification.name}-email`} />
                        <Label htmlFor={`${notification.name}-email`} className="text-sm text-muted-foreground">Email</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked id={`${notification.name}-push`} />
                        <Label htmlFor={`${notification.name}-push`} className="text-sm text-muted-foreground">Push</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-semibold">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                </div>
                <Button variant="outline" className="hover:border-primary hover:text-primary">Enable 2FA</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-semibold">Active Sessions</div>
                  <div className="text-sm text-muted-foreground">Manage devices where you're logged in</div>
                </div>
                <Button variant="outline" className="hover:border-primary hover:text-primary">View Sessions</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <div className="font-semibold">API Keys</div>
                  <div className="text-sm text-muted-foreground">Manage API access for integrations</div>
                </div>
                <Button variant="outline" className="hover:border-primary hover:text-primary">Manage Keys</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50">
                <div>
                  <div className="font-semibold text-red-700">Delete Account</div>
                  <div className="text-sm text-red-600/70">Permanently delete your account and all data</div>
                </div>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
