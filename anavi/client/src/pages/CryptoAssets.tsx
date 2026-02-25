import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  TrendingUp, 
  Shield, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Building2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Bitcoin,
  Gem
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

// Stablecoin backing data from Fireflies transcripts
const stablecoinBackings = [
  {
    id: 1,
    name: 'NAVI Stable',
    symbol: 'NAVIS',
    type: 'Asset-Backed Stablecoin',
    peg: 'USD',
    totalSupply: '125,000,000',
    marketCap: '$125M',
    backingRatio: 115,
    backingAssets: [
      { asset: 'Gold Reserves', percentage: 40, value: '$50M', location: 'Swiss Vault' },
      { asset: 'US Treasury Bills', percentage: 30, value: '$37.5M', location: 'Custodian Bank' },
      { asset: 'Real Estate Holdings', percentage: 20, value: '$25M', location: 'NYC, Miami' },
      { asset: 'Cash Reserves', percentage: 10, value: '$12.5M', location: 'Multi-bank' },
    ],
    auditor: 'Deloitte',
    lastAudit: '2026-01-15',
    status: 'Fully Collateralized',
    chain: 'Ethereum + Polygon',
  },
  {
    id: 2,
    name: 'GloFi Token',
    symbol: 'GLOFI',
    type: 'Commodity-Backed Token',
    peg: 'Gold (1 oz)',
    totalSupply: '50,000',
    marketCap: '$97.5M',
    backingRatio: 100,
    backingAssets: [
      { asset: 'Physical Gold', percentage: 100, value: '$97.5M', location: 'LBMA Vaults' },
    ],
    auditor: 'PwC',
    lastAudit: '2026-01-10',
    status: 'Fully Backed',
    chain: 'Ethereum',
  },
  {
    id: 3,
    name: 'Real Estate Yield Token',
    symbol: 'REYT',
    type: 'Real Estate-Backed Token',
    peg: 'Property NAV',
    totalSupply: '10,000,000',
    marketCap: '$45M',
    backingRatio: 120,
    backingAssets: [
      { asset: 'Commercial Properties', percentage: 60, value: '$27M', location: 'Manhattan' },
      { asset: 'Residential Portfolio', percentage: 30, value: '$13.5M', location: 'Miami Beach' },
      { asset: 'Development Rights', percentage: 10, value: '$4.5M', location: 'Brooklyn' },
    ],
    auditor: 'KPMG',
    lastAudit: '2026-01-12',
    status: 'Over-Collateralized',
    chain: 'Polygon',
  },
];

// Tokenization pipeline
const tokenizationPipeline = [
  {
    id: 1,
    name: 'Manhattan Office Tower',
    type: 'Commercial Real Estate',
    value: '$85M',
    tokenSupply: '8,500,000',
    pricePerToken: '$10',
    status: 'In Progress',
    progress: 75,
    targetDate: '2026-02-15',
    yieldProjection: '8.5% APY',
  },
  {
    id: 2,
    name: 'Gold Mining Rights - Nevada',
    type: 'Mineral Rights',
    value: '$25M',
    tokenSupply: '2,500,000',
    pricePerToken: '$10',
    status: 'Due Diligence',
    progress: 40,
    targetDate: '2026-03-01',
    yieldProjection: '12% APY',
  },
  {
    id: 3,
    name: 'Art Collection - Blue Chip',
    type: 'Fine Art',
    value: '$15M',
    tokenSupply: '1,500,000',
    pricePerToken: '$10',
    status: 'Legal Review',
    progress: 60,
    targetDate: '2026-02-28',
    yieldProjection: '5% APY',
  },
];

export default function CryptoAssets() {
  const [selectedTab, setSelectedTab] = useState('stablecoins');
  const { data: dbCrypto = [] } = trpc.crypto.list.useQuery();
  const cryptoPositions = dbCrypto.map((p) => ({
    id: p.id,
    asset: p.name,
    symbol: p.symbol,
    holdings: String(p.balance),
    avgCost: p.avgCost ? `$${parseFloat(p.avgCost).toLocaleString()}` : '$0',
    currentPrice: p.currentPrice ?? `$${p.value}`,
    value: `$${p.value.toLocaleString()}`,
    pnl: p.pnl ?? '0%',
    pnlValue: p.pnlValue ?? '$0',
    isPositive: true,
    allocation: p.allocation ?? 0,
  }));
  const totalPortfolioValue = dbCrypto.length > 0
    ? dbCrypto.reduce((sum, p) => sum + p.value, 0)
    : 11216675; // fallback for empty

  return (
    <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Coins className="h-7 w-7 text-sky-500" />
              Crypto & Stablecoin Assets
            </h1>
            <p className="text-muted-foreground mt-1">
              Asset-backed tokens, stablecoin reserves, and tokenization pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Prices
            </Button>
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-sky-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio</p>
                  <p className="text-2xl font-bold">${(totalPortfolioValue / 1000000).toFixed(2)}M</p>
                </div>
                <DollarSign className="h-8 w-8 text-sky-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>+$4.3M (52.4%)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stablecoin Reserves</p>
                  <p className="text-2xl font-bold">$267.5M</p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                <Lock className="h-4 w-4" />
                <span>115% Collateralized</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tokenization Pipeline</p>
                  <p className="text-2xl font-bold">$125M</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-blue-500 text-sm">
                <Globe className="h-4 w-4" />
                <span>3 Assets in Progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Yield Generated</p>
                  <p className="text-2xl font-bold">$2.8M</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>8.2% Avg APY</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
            <TabsTrigger value="stablecoins" className="text-xs md:text-sm">Stablecoins</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs md:text-sm">Portfolio</TabsTrigger>
            <TabsTrigger value="tokenization" className="text-xs md:text-sm">Tokenization</TabsTrigger>
          </TabsList>

          {/* Stablecoins Tab */}
          <TabsContent value="stablecoins" className="space-y-4">
            {stablecoinBackings.map((coin) => (
              <Card key={coin.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{coin.symbol}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{coin.name}</CardTitle>
                        <CardDescription>{coin.type}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={coin.status === 'Fully Collateralized' || coin.status === 'Over-Collateralized' ? 'default' : 'secondary'} className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {coin.status}
                      </Badge>
                      <Badge variant="outline">{coin.chain}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Peg</p>
                      <p className="font-semibold">{coin.peg}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Supply</p>
                      <p className="font-semibold">{coin.totalSupply}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Cap</p>
                      <p className="font-semibold">{coin.marketCap}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Backing Ratio</p>
                      <p className="font-semibold text-green-500">{coin.backingRatio}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Audit</p>
                      <p className="font-semibold">{coin.lastAudit}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Backing Assets</p>
                    <div className="space-y-2">
                      {coin.backingAssets.map((asset, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{asset.asset}</span>
                              <span className="text-muted-foreground">{asset.value} ({asset.percentage}%)</span>
                            </div>
                            <Progress value={asset.percentage} className="h-2" />
                          </div>
                          <Badge variant="outline" className="text-xs hidden md:inline-flex">{asset.location}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Audited by {coin.auditor}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      View Proof of Reserves
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-sky-500" />
                  Crypto Holdings
                </CardTitle>
                <CardDescription>Active cryptocurrency positions and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b text-left text-sm text-muted-foreground">
                        <TableHead className="pb-3 font-medium">Asset</TableHead>
                        <TableHead className="pb-3 font-medium hidden md:table-cell">Holdings</TableHead>
                        <TableHead className="pb-3 font-medium hidden md:table-cell">Avg Cost</TableHead>
                        <TableHead className="pb-3 font-medium">Current Price</TableHead>
                        <TableHead className="pb-3 font-medium">Value</TableHead>
                        <TableHead className="pb-3 font-medium text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cryptoPositions.map((position) => (
                        <TableRow key={position.id} className="border-b last:border-0">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{position.symbol}</span>
                              </div>
                              <div>
                                <p className="font-medium">{position.asset}</p>
                                <p className="text-xs text-muted-foreground">{position.allocation}% allocation</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 hidden md:table-cell">
                            <span className="font-mono">{position.holdings}</span>
                          </TableCell>
                          <TableCell className="py-4 hidden md:table-cell text-muted-foreground">
                            {position.avgCost}
                          </TableCell>
                          <TableCell className="py-4 font-medium">
                            {position.currentPrice}
                          </TableCell>
                          <TableCell className="py-4 font-semibold">
                            {position.value}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className={`flex items-center justify-end gap-1 ${position.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {position.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              <span className="font-semibold">{position.pnl}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{position.pnlValue}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokenization Tab */}
          <TabsContent value="tokenization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="h-5 w-5 text-purple-500" />
                  Asset Tokenization Pipeline
                </CardTitle>
                <CardDescription>Real-world assets being tokenized for fractional ownership</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tokenizationPipeline.map((asset) => (
                  <div key={asset.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          asset.status === 'In Progress' ? 'default' :
                          asset.status === 'Due Diligence' ? 'secondary' : 'outline'
                        }>
                          {asset.status}
                        </Badge>
                        <Badge variant="outline" className="text-green-500 border-green-500/20">
                          {asset.yieldProjection}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Asset Value</p>
                        <p className="font-semibold">{asset.value}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Token Supply</p>
                        <p className="font-semibold">{asset.tokenSupply}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price/Token</p>
                        <p className="font-semibold">{asset.pricePerToken}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Date</p>
                        <p className="font-semibold">{asset.targetDate}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{asset.progress}%</span>
                      </div>
                      <Progress value={asset.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
