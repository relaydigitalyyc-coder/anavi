import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gem, Droplets, Factory, Leaf, Search, Filter, Plus, 
  CheckCircle, AlertTriangle, Shield, Globe, Ship,
  FileText, TrendingUp, Wallet, Building2, MapPin,
  ChevronRight, Eye, MessageSquare, Star, Verified
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
import DashboardLayout from "@/components/DashboardLayout";

// Demo data for commodity listings
const commodityListings = [
  {
    id: 1,
    title: "99.99% Pure Gold Bullion - LBMA Certified",
    commodityType: "gold",
    goldForm: "bullion",
    goldPurity: 99.99,
    quantity: 500,
    unit: "kilograms",
    pricePerUnit: 65000,
    discountPercentage: 2.5,
    originCountry: "Switzerland",
    currentLocation: "Zurich Free Port",
    deliveryLocation: "Dubai, UAE",
    skrVerified: true,
    skrBank: "UBS AG",
    sanctionsCleared: true,
    isVerified: true,
    seller: { name: "Swiss Gold Refinery AG", verified: true, rating: 4.9 },
    status: "active",
  },
  {
    id: 2,
    title: "Bonny Light Crude Oil - Nigerian Export",
    commodityType: "crude_oil",
    oilGrade: "bonny_light",
    apiGravity: 35.4,
    sulfurContent: 0.14,
    quantity: 2000000,
    unit: "barrels",
    pricePerUnit: 78.50,
    refinerySource: "Port Harcourt Refinery",
    originCountry: "Nigeria",
    currentLocation: "Bonny Terminal",
    deliveryLocation: "Rotterdam, Netherlands",
    vesselType: "VLCC",
    sanctionsCleared: true,
    isVerified: true,
    seller: { name: "NNPC Trading", verified: true, rating: 4.7 },
    status: "active",
  },
  {
    id: 3,
    title: "Grade A Copper Cathodes - LME Registered",
    commodityType: "copper",
    quantity: 5000,
    unit: "metric_tonnes",
    pricePerUnit: 8450,
    originCountry: "Chile",
    mineOrSource: "Escondida Mine",
    currentLocation: "Antofagasta Port",
    deliveryLocation: "Shanghai, China",
    sanctionsCleared: true,
    isVerified: true,
    seller: { name: "BHP Billiton", verified: true, rating: 4.8 },
    status: "active",
  },
  {
    id: 4,
    title: "LNG Cargo - Qatar Export Quality",
    commodityType: "lng",
    quantity: 150000,
    unit: "cubic_meters",
    pricePerUnit: 12.50,
    pricingBasis: "JKM Index",
    originCountry: "Qatar",
    currentLocation: "Ras Laffan Terminal",
    deliveryLocation: "Futtsu, Japan",
    vesselType: "Q-Max LNG Carrier",
    vesselCapacity: 266000,
    sanctionsCleared: true,
    isVerified: true,
    seller: { name: "QatarEnergy", verified: true, rating: 5.0 },
    status: "active",
  },
  {
    id: 5,
    title: "Gold Dory Bars - African Origin",
    commodityType: "gold",
    goldForm: "dory",
    goldPurity: 92.5,
    quantity: 100,
    unit: "kilograms",
    pricePerUnit: 58000,
    discountPercentage: 5.0,
    originCountry: "Ghana",
    mineOrSource: "Obuasi Gold Mine",
    currentLocation: "Accra, Ghana",
    deliveryLocation: "Dubai, UAE",
    skrVerified: false,
    sanctionsCleared: true,
    isVerified: false,
    seller: { name: "West African Gold Ltd", verified: false, rating: 4.2 },
    status: "pending_verification",
  },
];

const commodityCategories = [
  { id: "all", label: "All Commodities", icon: Globe, count: 156 },
  { id: "gold", label: "Gold & Precious Metals", icon: Gem, count: 45 },
  { id: "oil_gas", label: "Oil & Gas", icon: Droplets, count: 38 },
  { id: "minerals", label: "Minerals & Metals", icon: Factory, count: 52 },
  { id: "agricultural", label: "Agricultural", icon: Leaf, count: 21 },
];

const CommodityCard = ({ listing }: { listing: typeof commodityListings[0] }) => {
  const getCommodityIcon = () => {
    switch (listing.commodityType) {
      case "gold": return <Gem className="h-5 w-5 text-yellow-500" />;
      case "crude_oil":
      case "lng": return <Droplets className="h-5 w-5 text-blue-500" />;
      case "copper": return <Factory className="h-5 w-5 text-orange-500" />;
      default: return <Globe className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatPrice = (price: number, unit: string) => {
    return `$${price.toLocaleString()} / ${unit.replace("_", " ")}`;
  };

  const getTotalValue = () => {
    return listing.quantity * listing.pricePerUnit;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getCommodityIcon()}
              </div>
              <div>
                <CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-3 w-3" />
                  {listing.originCountry}
                  <span className="text-muted-foreground/50">→</span>
                  {listing.deliveryLocation}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {listing.isVerified && (
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {listing.skrVerified && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  SKR
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quantity & Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-semibold">
                {listing.quantity.toLocaleString()} {listing.unit.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold text-primary">
                {formatPrice(listing.pricePerUnit, listing.unit)}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-lg font-bold">${getTotalValue().toLocaleString()}</span>
            </div>
            {listing.discountPercentage && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">{listing.discountPercentage}% below spot</span>
              </div>
            )}
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap gap-2">
            {listing.sanctionsCleared && (
              <Badge variant="outline" className="text-xs bg-green-500/5 border-green-500/20 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Sanctions Cleared
              </Badge>
            )}
            {listing.vesselType && (
              <Badge variant="outline" className="text-xs">
                <Ship className="h-3 w-3 mr-1" />
                {listing.vesselType}
              </Badge>
            )}
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  {listing.seller.name}
                  {listing.seller.verified && <Verified className="h-3 w-3 text-blue-500" />}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{listing.seller.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm">
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

export default function Commodities() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredListings = commodityListings.filter(listing => {
    if (selectedCategory !== "all") {
      if (selectedCategory === "gold" && listing.commodityType !== "gold") return false;
      if (selectedCategory === "oil_gas" && !["crude_oil", "lng", "natural_gas"].includes(listing.commodityType)) return false;
      if (selectedCategory === "minerals" && !["copper", "iron_ore"].includes(listing.commodityType)) return false;
    }
    if (searchQuery) {
      return listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             listing.originCountry.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Commodities Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Trade verified gold, oil & gas, minerals, and agricultural commodities
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                List Commodity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>List a Commodity</DialogTitle>
                <DialogDescription>
                  Create a new commodity listing for the marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Commodity Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="crude_oil">Crude Oil</SelectItem>
                        <SelectItem value="lng">LNG</SelectItem>
                        <SelectItem value="copper">Copper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Form (for Gold)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bullion">Bullion</SelectItem>
                        <SelectItem value="dory">Dory</SelectItem>
                        <SelectItem value="nuggets">Nuggets</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="e.g., 99.99% Pure Gold Bullion - LBMA Certified" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kilograms">Kilograms</SelectItem>
                        <SelectItem value="troy_ounces">Troy Ounces</SelectItem>
                        <SelectItem value="metric_tonnes">Metric Tonnes</SelectItem>
                        <SelectItem value="barrels">Barrels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Purity %</Label>
                    <Input type="number" placeholder="99.99" step="0.01" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price per Unit (USD)</Label>
                    <Input type="number" placeholder="65000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount from Spot %</Label>
                    <Input type="number" placeholder="2.5" step="0.1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin Country</Label>
                    <Input placeholder="Switzerland" />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Location</Label>
                    <Input placeholder="Zurich Free Port" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delivery Location</Label>
                    <Input placeholder="Dubai, UAE" />
                  </div>
                  <div className="space-y-2">
                    <Label>Incoterms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fob">FOB</SelectItem>
                        <SelectItem value="cif">CIF</SelectItem>
                        <SelectItem value="exw">EXW</SelectItem>
                        <SelectItem value="dap">DAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>SKR Details (if applicable)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="SKR Number" />
                    <Input placeholder="Issuing Bank" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Provide detailed information about the commodity..." rows={4} />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button>Submit for Verification</Button>
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
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Gem className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$2.4B</p>
                  <p className="text-xs text-muted-foreground">Gold Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">15M</p>
                  <p className="text-xs text-muted-foreground">Barrels Oil</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Verified Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Wallet className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$890M</p>
                  <p className="text-xs text-muted-foreground">Monthly Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {commodityCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className="gap-2"
              onClick={() => setSelectedCategory(category.id)}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
              <Badge variant="secondary" className="ml-1">{category.count}</Badge>
            </Button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by commodity, origin, or seller..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredListings.map((listing) => (
              <CommodityCard key={listing.id} listing={listing} />
            ))}
          </AnimatePresence>
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
