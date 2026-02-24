import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, Search, Filter, MapPin, DollarSign, Users, 
  TrendingUp, Globe, Briefcase, ChevronRight, ExternalLink,
  Building, Target, Landmark, UserPlus, Linkedin, Instagram, Plus
} from "lucide-react";

function formatAum(aum: number | null): string {
  if (!aum) return "Undisclosed";
  if (aum >= 1e12) return `$${(aum / 1e12).toFixed(1)}T`;
  if (aum >= 1e9) return `$${(aum / 1e9).toFixed(1)}B`;
  if (aum >= 1e6) return `$${(aum / 1e6).toFixed(0)}M`;
  return `$${aum.toLocaleString()}`;
}

function formatAumRange(range: string | null): string {
  const ranges: Record<string, string> = {
    'under_100m': 'Under $100M',
    '100m_500m': '$100M - $500M',
    '500m_1b': '$500M - $1B',
    '1b_5b': '$1B - $5B',
    '5b_10b': '$5B - $10B',
    '10b_50b': '$10B - $50B',
    '50b_plus': '$50B+',
  };
  return range ? ranges[range] || range : 'Undisclosed';
}

export default function FamilyOffices() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [aumFilter, setAumFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState({ name: "", title: "", email: "", linkedin: "", phone: "" });
  const { isAuthenticated } = useAuth();
  
  const addToTargets = trpc.familyOffice.addToTargets.useMutation({
    onSuccess: () => {
      toast.success("Added to targets");
    },
    onError: () => {
      toast.error("Failed to add to targets");
    },
  });
  
  const importContact = trpc.familyOffice.importContact.useMutation({
    onSuccess: () => {
      toast.success("Contact imported to your contacts");
      setImportDialogOpen(false);
      setImportData({ name: "", title: "", email: "", linkedin: "", phone: "" });
    },
    onError: () => {
      toast.error("Failed to import contact");
    },
  });

  const { data: officesData, isLoading } = trpc.familyOffice.list.useQuery({
    search: search || undefined,
    type: typeFilter || undefined,
    aumRange: aumFilter || undefined,
    state: stateFilter || undefined,
    limit: 100,
  });

  const { data: stats } = trpc.familyOffice.stats.useQuery();
  
  const { data: selectedOfficeData } = trpc.familyOffice.get.useQuery(
    { id: selectedOffice! },
    { enabled: !!selectedOffice }
  );

  const offices = officesData?.data || [];
  const totalCount = officesData?.total || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-[#C9A962] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-[#C9A962] blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A962] to-[#B8944D] flex items-center justify-center">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#C9A962] font-medium tracking-wider uppercase text-sm">Family Office Database</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-serif font-light mb-4">
            USA Family Offices
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mb-8">
            Comprehensive database of {totalCount}+ family offices and institutional investors across the United States.
          </p>
          
          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-light text-[#C9A962] mb-1">{stats.total}</div>
                <div className="text-sm text-white/60">Total Offices</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-light text-[#C9A962] mb-1">
                  {formatAum(Number(stats.totalAum))}
                </div>
                <div className="text-sm text-white/60">Combined AUM</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-light text-[#C9A962] mb-1">
                  {stats.byType?.find(t => t.type === 'single_family')?.count || 0}
                </div>
                <div className="text-sm text-white/60">Single Family</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-light text-[#C9A962] mb-1">
                  {stats.byType?.find(t => t.type === 'multi_family')?.count || 0}
                </div>
                <div className="text-sm text-white/60">Multi Family</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
              <Input
                placeholder="Search by name, family, city, or wealth source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 bg-white border-[#E8E4DC] rounded-xl text-[#2C2C2C] placeholder:text-[#8B7355]/60"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-12 bg-white border-[#E8E4DC] rounded-xl">
                <SelectValue placeholder="Office Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single_family">Single Family</SelectItem>
                <SelectItem value="multi_family">Multi Family</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={aumFilter} onValueChange={setAumFilter}>
              <SelectTrigger className="w-[180px] h-12 bg-white border-[#E8E4DC] rounded-xl">
                <SelectValue placeholder="AUM Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All AUM</SelectItem>
                <SelectItem value="50b_plus">$50B+</SelectItem>
                <SelectItem value="10b_50b">$10B - $50B</SelectItem>
                <SelectItem value="5b_10b">$5B - $10B</SelectItem>
                <SelectItem value="1b_5b">$1B - $5B</SelectItem>
                <SelectItem value="500m_1b">$500M - $1B</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[180px] h-12 bg-white border-[#E8E4DC] rounded-xl">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="California">California</SelectItem>
                <SelectItem value="Texas">Texas</SelectItem>
                <SelectItem value="Illinois">Illinois</SelectItem>
                <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                <SelectItem value="Connecticut">Connecticut</SelectItem>
                <SelectItem value="Florida">Florida</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-[#8B7355]">
              {totalCount} results
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-[#E8E4DC]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map((office) => (
              <Card 
                key={office.id}
                className="group bg-white border-[#E8E4DC] rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#C9A962]/30 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedOffice(office.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2C2C2C] to-[#4a4a4a] flex items-center justify-center text-white font-semibold text-lg">
                        {office.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] group-hover:text-[#C9A962] transition-colors line-clamp-1">
                          {office.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-[#E8E4DC] text-[#8B7355]">
                            {office.type === 'single_family' ? 'SFO' : 'MFO'}
                          </Badge>
                          {office.globalRank && (
                            <Badge className="text-xs bg-[#C9A962]/10 text-[#C9A962] border-0">
                              #{office.globalRank}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* AUM */}
                  <div className="flex items-center justify-between py-3 border-t border-[#E8E4DC]">
                    <div className="flex items-center gap-2 text-[#8B7355]">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">AUM</span>
                    </div>
                    <span className="font-semibold text-[#2C2C2C]">
                      {formatAum(office.aum)}
                    </span>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#8B7355]">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Location</span>
                    </div>
                    <span className="text-sm text-[#2C2C2C]">
                      {office.city}, {office.state}
                    </span>
                  </div>
                  
                  {/* Founding Family */}
                  {office.foundingFamily && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#8B7355]">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Family</span>
                      </div>
                      <span className="text-sm text-[#2C2C2C]">
                        {office.foundingFamily}
                      </span>
                    </div>
                  )}
                  
                  {/* Investment Focus Tags */}
                  {office.investmentFocus && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(Array.isArray(office.investmentFocus) ? office.investmentFocus : JSON.parse(office.investmentFocus as unknown as string || '[]')).slice(0, 3).map((focus: string, i: number) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="text-xs bg-[#F5F3EF] text-[#8B7355] border-0 capitalize"
                        >
                          {focus.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && offices.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-[#8B7355]/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-[#2C2C2C] mb-2">No family offices found</h3>
            <p className="text-[#8B7355]">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOffice} onOpenChange={() => setSelectedOffice(null)}>
        <DialogContent className="max-w-2xl bg-white border-[#E8E4DC]">
          {selectedOfficeData && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2C2C2C] to-[#4a4a4a] flex items-center justify-center text-white font-semibold text-2xl">
                    {selectedOfficeData.name.charAt(0)}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-serif text-[#2C2C2C]">
                      {selectedOfficeData.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="border-[#E8E4DC] text-[#8B7355]">
                        {selectedOfficeData.type === 'single_family' ? 'Single Family Office' : 'Multi Family Office'}
                      </Badge>
                      {selectedOfficeData.globalRank && (
                        <Badge className="bg-[#C9A962]/10 text-[#C9A962] border-0">
                          Global Rank #{selectedOfficeData.globalRank}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 py-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F5F3EF] rounded-xl p-4">
                      <div className="text-sm text-[#8B7355] mb-1">Assets Under Management</div>
                      <div className="text-2xl font-semibold text-[#2C2C2C]">
                        {formatAum(selectedOfficeData.aum)}
                      </div>
                      <div className="text-xs text-[#8B7355] mt-1">
                        {formatAumRange(selectedOfficeData.aumRange)}
                      </div>
                    </div>
                    <div className="bg-[#F5F3EF] rounded-xl p-4">
                      <div className="text-sm text-[#8B7355] mb-1">Location</div>
                      <div className="text-lg font-medium text-[#2C2C2C]">
                        {selectedOfficeData.city}, {selectedOfficeData.state}
                      </div>
                      <div className="text-xs text-[#8B7355] mt-1">
                        {selectedOfficeData.country}
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-4">
                    {selectedOfficeData.foundingFamily && (
                      <div className="flex items-center justify-between py-3 border-b border-[#E8E4DC]">
                        <span className="text-[#8B7355]">Founding Family</span>
                        <span className="font-medium text-[#2C2C2C]">{selectedOfficeData.foundingFamily}</span>
                      </div>
                    )}
                    {selectedOfficeData.wealthSource && (
                      <div className="flex items-center justify-between py-3 border-b border-[#E8E4DC]">
                        <span className="text-[#8B7355]">Wealth Source</span>
                        <span className="font-medium text-[#2C2C2C]">{selectedOfficeData.wealthSource}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b border-[#E8E4DC]">
                      <span className="text-[#8B7355]">Data Confidence</span>
                      <Badge 
                        className={
                          selectedOfficeData.dataConfidence === 'high' 
                            ? 'bg-green-100 text-green-700 border-0' 
                            : selectedOfficeData.dataConfidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 border-0'
                            : 'bg-gray-100 text-gray-700 border-0'
                        }
                      >
                        {selectedOfficeData.dataConfidence}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Investment Focus */}
                  {selectedOfficeData.investmentFocus && (
                    <div>
                      <h4 className="text-sm font-medium text-[#8B7355] mb-3">Investment Focus</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedOfficeData.investmentFocus) ? selectedOfficeData.investmentFocus : JSON.parse(selectedOfficeData.investmentFocus as unknown as string || '[]')).map((focus: string, i: number) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="border-[#C9A962]/30 text-[#8B7355] capitalize"
                          >
                            {focus.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Key Contacts */}
                  {selectedOfficeData.keyContacts && (
                    <div>
                      <h4 className="text-sm font-medium text-[#8B7355] mb-3">Key Contacts</h4>
                      <div className="space-y-3">
                        {(Array.isArray(selectedOfficeData.keyContacts) ? selectedOfficeData.keyContacts : JSON.parse(selectedOfficeData.keyContacts as unknown as string || '[]')).map((contact: {name: string; title?: string; email?: string}, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#F5F3EF] rounded-xl">
                            <div>
                              <div className="font-medium text-[#2C2C2C]">{contact.name}</div>
                              {contact.title && (
                                <div className="text-sm text-[#8B7355]">{contact.title}</div>
                              )}
                            </div>
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="text-sm text-[#C9A962] hover:underline"
                              >
                                {contact.email}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="flex-1 bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.error("Please log in to add targets");
                          return;
                        }
                        addToTargets.mutate({ familyOfficeId: selectedOffice!, priority: "medium" });
                      }}
                      disabled={addToTargets.isPending}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Add to Targets
                    </Button>
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 border-[#E8E4DC]">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Import Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Import Contact from {selectedOfficeData?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-sm font-medium text-stone-700">Contact Name *</label>
                            <Input
                              className="mt-1"
                              value={importData.name}
                              onChange={(e) => setImportData({ ...importData, name: e.target.value })}
                              placeholder="John Smith"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-700">Title</label>
                            <Input
                              className="mt-1"
                              value={importData.title}
                              onChange={(e) => setImportData({ ...importData, title: e.target.value })}
                              placeholder="Chief Investment Officer"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-700">Email</label>
                            <Input
                              className="mt-1"
                              value={importData.email}
                              onChange={(e) => setImportData({ ...importData, email: e.target.value })}
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-700">LinkedIn URL</label>
                            <Input
                              className="mt-1"
                              value={importData.linkedin}
                              onChange={(e) => setImportData({ ...importData, linkedin: e.target.value })}
                              placeholder="https://linkedin.com/in/johnsmith"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-stone-700">Phone</label>
                            <Input
                              className="mt-1"
                              value={importData.phone}
                              onChange={(e) => setImportData({ ...importData, phone: e.target.value })}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <Button
                            className="w-full bg-[#C9A962] hover:bg-[#B8944D] text-white"
                            onClick={() => {
                              if (!importData.name) {
                                toast.error("Contact name is required");
                                return;
                              }
                              importContact.mutate({
                                familyOfficeId: selectedOffice!,
                                ...importData,
                              });
                            }}
                            disabled={importContact.isPending}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Import to My Contacts
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex gap-2 pt-2">
                    {selectedOfficeData?.linkedinUrl && (
                      <Button variant="outline" size="sm" className="border-[#E8E4DC]" asChild>
                        <a href={selectedOfficeData.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {selectedOfficeData?.website && (
                      <Button variant="outline" size="sm" className="border-[#E8E4DC]" asChild>
                        <a href={selectedOfficeData.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
