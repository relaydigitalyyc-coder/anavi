import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  User, Shield, Bell, Key, 
  Upload, CheckCircle2, Clock, Save,
  Compass
} from "lucide-react";
import { toast } from "sonner";
import { useTourContext } from "@/contexts/TourContext";

export default function Settings() {
  const tour = useTourContext();
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="dash-heading text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-[#1E3A5F]/60">
          Manage your account, verification, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="card-elevated p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white rounded-md text-[#1E3A5F]/60 text-sm">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white rounded-md text-[#1E3A5F]/60 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white rounded-md text-[#1E3A5F]/60 text-sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white rounded-md text-[#1E3A5F]/60 text-sm">
            <Key className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white rounded-md text-[#1E3A5F]/60 text-sm">
            <Compass className="w-4 h-4 mr-2" />
            Help
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Personal Information</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Update your profile information visible to verified counterparties
            </p>
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="John Doe"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Job Title</Label>
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
                  <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Company</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Acme Capital"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Location</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="New York, NY"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Website</Label>
                <Input
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others about yourself and your expertise..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="btn-gold px-6">
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Contact Handles</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Add your communication channels for verified connections
            </p>
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
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Verification Status</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Complete verification to unlock full platform features
            </p>
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
          </div>

          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Upload Documents</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Submit verification documents securely
            </p>
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
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Notification Preferences</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Choose how you want to be notified
            </p>
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
                        <Label htmlFor={`${notification.name}-email`} className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Email</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked id={`${notification.name}-push`} />
                        <Label htmlFor={`${notification.name}-push`} className="text-xs font-semibold text-[#1E3A5F]/60 uppercase">Push</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Security Settings</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Manage your account security and authentication
            </p>
            <div className="space-y-4">
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
            </div>
          </div>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="dash-heading text-lg mb-2">Guided Tour</h3>
            <p className="text-sm text-[#1E3A5F]/60 mb-5">
              Take a 2-minute tour of the platform to see where everything lives.
            </p>
            <Button
              onClick={() => {
                tour.restart();
                toast.success("Tour started");
              }}
              className="btn-gold"
            >
              <Compass className="w-4 h-4 mr-2" />
              Restart Tour
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
