import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Building2, MapPin, Search, Filter, Plus, DollarSign,
  TrendingUp, Users, Calendar, Eye, MessageSquare, Star,
  Home, Warehouse, Hotel, ShoppingBag, Factory, Trees,
  ChevronRight, Verified, FileText, BarChart3, Percent,
  Square, Layers, ArrowUpRight, Brain, X, Bed, Bath, Ruler
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// Fallback demo data when no DB records (for demo mode)
const DEMO_PROPERTIES = [
  {
    id: 1,
    title: "131 West 57th Street - Billionaires' Row",
    address: "131 W 57th St, New York, NY 10019",
    propertyType: "office",
    totalSqFt: 450000,
    floors: 42,
    yearBuilt: 1988,
    askingPrice: 285000000,
    pricePerSqFt: 633,
    capRate: 5.2,
    occupancyRate: 94,
    netOperatingIncome: 14820000,
    hasAirRights: true,
    airRightsSqFt: 125000,
    zoning: "C5-2.5",
    totalTenants: 28,
    status: "active",
    isOffMarket: true,
    isVerified: true,
    aiUnderwritingScore: 87,
    owner: { name: "Brookfield Properties", verified: true },
    photos: ["/api/placeholder/400/300"],
    comparables: [
      { address: "One57", pricePerSqFt: 680, saleDate: "2024-06" },
      { address: "432 Park", pricePerSqFt: 720, saleDate: "2024-03" },
    ],
  },
  {
    id: 2,
    title: "Meridian Industrial Portfolio - 10 Buildings",
    address: "Various Locations, New Jersey",
    propertyType: "industrial",
    totalSqFt: 2500000,
    floors: 1,
    yearBuilt: 2019,
    askingPrice: 425000000,
    pricePerSqFt: 170,
    capRate: 6.8,
    occupancyRate: 100,
    netOperatingIncome: 28900000,
    hasAirRights: false,
    totalTenants: 15,
    status: "active",
    isOffMarket: false,
    isVerified: true,
    aiUnderwritingScore: 92,
    owner: { name: "Prologis", verified: true },
    photos: ["/api/placeholder/400/300"],
    tenantRoll: [
      { name: "Amazon", sqft: 800000, rentPerSqFt: 12.50 },
      { name: "FedEx", sqft: 450000, rentPerSqFt: 11.75 },
    ],
  },
  {
    id: 3,
    title: "The Grand Hotel - Miami Beach",
    address: "1500 Collins Ave, Miami Beach, FL 33139",
    propertyType: "hotel",
    totalSqFt: 320000,
    floors: 18,
    units: 450,
    yearBuilt: 1972,
    yearRenovated: 2021,
    askingPrice: 195000000,
    pricePerSqFt: 609,
    capRate: 7.2,
    occupancyRate: 78,
    netOperatingIncome: 14040000,
    hasAirRights: true,
    airRightsSqFt: 80000,
    status: "active",
    isOffMarket: true,
    isVerified: true,
    aiUnderwritingScore: 79,
    owner: { name: "Host Hotels & Resorts", verified: true },
    photos: ["/api/placeholder/400/300"],
  },
  {
    id: 4,
    title: "Luxury Multifamily - Upper East Side",
    address: "200 E 79th St, New York, NY 10075",
    propertyType: "multifamily",
    totalSqFt: 185000,
    floors: 22,
    units: 156,
    yearBuilt: 2015,
    askingPrice: 142000000,
    pricePerSqFt: 768,
    capRate: 4.1,
    occupancyRate: 97,
    netOperatingIncome: 5822000,
    hasAirRights: false,
    totalTenants: 156,
    status: "under_contract",
    isOffMarket: true,
    isVerified: true,
    aiUnderwritingScore: 94,
    owner: { name: "Related Companies", verified: true },
    photos: ["/api/placeholder/400/300"],
  },
  {
    id: 5,
    title: "Development Site - Brooklyn Waterfront",
    address: "500 Kent Ave, Brooklyn, NY 11249",
    propertyType: "land",
    totalSqFt: 0,
    lotSize: 125000,
    askingPrice: 85000000,
    pricePerSqFt: 680,
    hasAirRights: true,
    airRightsSqFt: 450000,
    zoning: "R8A",
    far: 6.02,
    developmentPotential: "Up to 750,000 SF of residential with ground floor retail. Waterfront access and park adjacency.",
    status: "active",
    isOffMarket: true,
    isVerified: false,
    aiUnderwritingScore: 71,
    owner: { name: "Two Trees Management", verified: true },
    photos: ["/api/placeholder/400/300"],
  },
];

const propertyTypeIcons: Record<string, React.ElementType> = {
  office: Building2,
  retail: ShoppingBag,
  industrial: Factory,
  multifamily: Home,
  hotel: Hotel,
  warehouse: Warehouse,
  land: Trees,
  mixed_use: Layers,
};

const propertyCategories = [
  { id: "all", label: "All Properties", count: 89 },
  { id: "office", label: "Office", count: 24 },
  { id: "multifamily", label: "Multifamily", count: 31 },
  { id: "industrial", label: "Industrial", count: 18 },
  { id: "retail", label: "Retail", count: 12 },
  { id: "hotel", label: "Hotel", count: 4 },
];

const PropertyCard = ({ property, onSelect }: { property: any; onSelect: (id: number) => void }) => {
  const PropertyIcon = propertyTypeIcons[property.propertyType] || Building2;

  const getStatusBadge = () => {
    switch (property.status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "under_contract":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Under Contract</Badge>;
      case "pending":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pending</Badge>;
      default:
        return null;
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 cursor-pointer" onClick={() => onSelect(property.id)}>
        {/* Property Image */}
        <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50">
          <div className="absolute inset-0 flex items-center justify-center">
            <PropertyIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            {property.isOffMarket && (
              <Badge variant="secondary" className="bg-black/70 text-white">
                Off-Market
              </Badge>
            )}
            {getStatusBadge()}
          </div>
          <div className="absolute top-3 right-3">
            {property.isVerified && (
              <Badge className="bg-green-500/90 text-white">
                <Verified className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {/* AI Score */}
          <div className="absolute bottom-3 right-3 bg-black/70 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className={`font-bold ${getAIScoreColor(property.aiUnderwritingScore)}`}>
              {property.aiUnderwritingScore}
            </span>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Title & Address */}
          <div>
            <h3 className="font-semibold line-clamp-1">{property.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {property.address}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Asking Price</p>
              <p className="font-bold text-lg">${(property.askingPrice / 1000000).toFixed(0)}M</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Price/SF</p>
              <p className="font-bold text-lg">${property.pricePerSqFt}</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="flex flex-wrap gap-3 text-sm">
            {property.capRate && (
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3 text-muted-foreground" />
                <span>{property.capRate}% Cap</span>
              </div>
            )}
            {property.occupancyRate && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>{property.occupancyRate}% Occ</span>
              </div>
            )}
            {property.totalSqFt > 0 && (
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3 text-muted-foreground" />
                <span>{(property.totalSqFt / 1000).toFixed(0)}K SF</span>
              </div>
            )}
          </div>

          {/* Air Rights Badge */}
          {property.hasAirRights && (
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">Air Rights Available</span>
                </div>
                <span className="text-sm font-bold">{(property.airRightsSqFt! / 1000).toFixed(0)}K SF</span>
              </div>
            </div>
          )}

          {/* Owner & Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  {property.owner.name}
                  {property.owner.verified && <Verified className="h-3 w-3 text-blue-500" />}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(property.id); }}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={(e) => e.stopPropagation()}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Inquire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const INITIAL_FORM = {
  title: "",
  address: "",
  propertyType: "" as string,
  askingPrice: "",
  totalSqFt: "",
};

export default function RealEstate() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const utils = trpc.useUtils();

  const { data: dbProperties = [] } = trpc.realEstate.list.useQuery({});
  const realEstateProperties = dbProperties.length > 0
    ? (dbProperties as any[]).map((p) => ({
        ...p,
        askingPrice: Number(p.askingPrice ?? 0),
        pricePerSqFt: Number(p.pricePerSqFt ?? 0) || (p.totalSqFt ? Math.round(Number(p.askingPrice ?? 0) / Number(p.totalSqFt ?? 1)) : 0),
        totalSqFt: Number(p.totalSqFt ?? 0),
        owner: p.owner ?? { name: "You", verified: true },
        photos: p.photos ?? ["/api/placeholder/400/300"],
        aiUnderwritingScore: Number(p.aiUnderwritingScore ?? 0) || 75,
      }))
    : DEMO_PROPERTIES;

  const { data: selectedProperty, isLoading: isLoadingDetail } = trpc.realEstate.get.useQuery(
    { id: selectedPropertyId! },
    { enabled: !!selectedPropertyId },
  );

  const createProperty = trpc.realEstate.create.useMutation({
    onSuccess: () => {
      toast.success("Property listed successfully");
      utils.realEstate.list.invalidate();
      setShowCreateDialog(false);
      setForm(INITIAL_FORM);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create listing");
    },
  });

  const handleSubmitProperty = () => {
    if (!form.title || !form.address || !form.propertyType) {
      toast.error("Please fill in required fields (title, address, property type)");
      return;
    }
    createProperty.mutate({
      title: form.title,
      address: form.address,
      propertyType: form.propertyType as any,
      askingPrice: form.askingPrice || undefined,
      totalSqFt: form.totalSqFt || undefined,
      status: "active",
    });
  };

  const filteredProperties = realEstateProperties.filter((property: any) => {
    if (selectedCategory !== "all" && property.propertyType !== selectedCategory) return false;
    if (searchQuery) {
      return property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             property.address.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const detailProp = selectedProperty as any;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Real Estate Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Off-market properties with AI-powered underwriting and tenant analysis
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                List Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>List a Property</DialogTitle>
                <DialogDescription>
                  Add a new property to the marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select value={form.propertyType} onValueChange={(v) => setForm({ ...form, propertyType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="multifamily">Multifamily</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Listing Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="lease">For Lease</SelectItem>
                        <SelectItem value="joint_venture">Joint Venture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Property Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Class A Office Tower - Midtown Manhattan"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Full street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total SF</Label>
                    <Input
                      type="number"
                      value={form.totalSqFt}
                      onChange={(e) => setForm({ ...form, totalSqFt: e.target.value })}
                      placeholder="450000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asking Price ($)</Label>
                    <Input
                      type="number"
                      value={form.askingPrice}
                      onChange={(e) => setForm({ ...form, askingPrice: e.target.value })}
                      placeholder="285000000"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmitProperty} disabled={createProperty.isPending}>
                    {createProperty.isPending ? "Submitting…" : "Submit Property"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$4.2B</p>
                  <p className="text-xs text-muted-foreground">Total Inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-muted-foreground">AI Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5.8%</p>
                  <p className="text-xs text-muted-foreground">Avg Cap Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <ArrowUpRight className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2.1M</p>
                  <p className="text-xs text-muted-foreground">Air Rights SF</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {propertyCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                {category.label}
                <Badge variant="secondary" className="ml-1">{category.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 flex-1 md:flex-none">
              <Filter className="h-4 w-4" />
              <span className="hidden md:inline">Filters</span>
            </Button>
            <Button variant="outline" className="gap-2 flex-1 md:flex-none">
              <Brain className="h-4 w-4" />
              <span className="hidden md:inline">AI Match</span>
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} onSelect={setSelectedPropertyId} />
            ))}
          </AnimatePresence>
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No properties found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Property Detail Sheet */}
        <Sheet open={!!selectedPropertyId} onOpenChange={(open) => { if (!open) setSelectedPropertyId(null); }}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{detailProp?.title ?? "Property Details"}</SheetTitle>
              <SheetDescription>
                {detailProp?.address ?? "Loading property details…"}
              </SheetDescription>
            </SheetHeader>

            {isLoadingDetail && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {detailProp && !isLoadingDetail && (
              <div className="space-y-6 py-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                  <Badge variant="outline" className="capitalize">{detailProp.propertyType?.replace("_", " ")}</Badge>
                </div>

                {detailProp.askingPrice && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Asking Price</p>
                    <p className="text-2xl font-bold">
                      ${Number(detailProp.askingPrice) >= 1_000_000
                        ? `${(Number(detailProp.askingPrice) / 1_000_000).toFixed(1)}M`
                        : Number(detailProp.askingPrice).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {Number(detailProp.totalSqFt) > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Ruler className="h-3.5 w-3.5" />
                        <span className="text-xs">Total SF</span>
                      </div>
                      <p className="font-semibold">{Number(detailProp.totalSqFt).toLocaleString()}</p>
                    </div>
                  )}
                  {detailProp.bedrooms && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Bed className="h-3.5 w-3.5" />
                        <span className="text-xs">Bedrooms</span>
                      </div>
                      <p className="font-semibold">{detailProp.bedrooms}</p>
                    </div>
                  )}
                  {detailProp.bathrooms && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Bath className="h-3.5 w-3.5" />
                        <span className="text-xs">Bathrooms</span>
                      </div>
                      <p className="font-semibold">{detailProp.bathrooms}</p>
                    </div>
                  )}
                  {detailProp.floors && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="text-xs">Floors</span>
                      </div>
                      <p className="font-semibold">{detailProp.floors}</p>
                    </div>
                  )}
                  {detailProp.yearBuilt && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">Year Built</span>
                      </div>
                      <p className="font-semibold">{detailProp.yearBuilt}</p>
                    </div>
                  )}
                  {detailProp.capRate && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Percent className="h-3.5 w-3.5" />
                        <span className="text-xs">Cap Rate</span>
                      </div>
                      <p className="font-semibold">{detailProp.capRate}%</p>
                    </div>
                  )}
                  {detailProp.occupancyRate && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Occupancy</span>
                      </div>
                      <p className="font-semibold">{detailProp.occupancyRate}%</p>
                    </div>
                  )}
                  {detailProp.netOperatingIncome && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="text-xs">NOI</span>
                      </div>
                      <p className="font-semibold">${(Number(detailProp.netOperatingIncome) / 1_000_000).toFixed(1)}M</p>
                    </div>
                  )}
                </div>

                {detailProp.description && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                    <p className="text-sm leading-relaxed">{detailProp.description}</p>
                  </div>
                )}

                {detailProp.zoning && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Zoning</p>
                    <p className="text-sm font-medium">{detailProp.zoning}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant={detailProp.status === "active" ? "default" : "secondary"} className="capitalize">
                    {detailProp.status?.replace("_", " ")}
                  </Badge>
                  {detailProp.isVerified && (
                    <Badge className="bg-green-500/90 text-white">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
  );
}
