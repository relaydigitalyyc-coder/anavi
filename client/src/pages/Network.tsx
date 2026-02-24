import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Network as NetworkIcon, ZoomIn, ZoomOut, Maximize2, 
  Filter, Users, Share2, RefreshCw, Layers, Search
} from "lucide-react";

export default function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: networkData, isLoading, refetch } = trpc.relationship.getNetwork.useQuery();

  // Elegant network visualization using canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !networkData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with cream background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const nodes = networkData.nodes || [];
    const edges = networkData.edges || [];

    // Position nodes in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35 * zoom;

    const nodePositions = nodes.map((node: any, i: number) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Draw edges with gradient
    edges.forEach((edge: any) => {
      const source = nodePositions.find((n: any) => n.id === edge.source);
      const target = nodePositions.find((n: any) => n.id === edge.target);
      if (source && target) {
        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        gradient.addColorStop(0, 'rgba(201, 162, 39, 0.4)');
        gradient.addColorStop(1, 'rgba(201, 162, 39, 0.2)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodePositions.forEach((node: any) => {
      // Node shadow
      ctx.beginPath();
      ctx.arc(node.x + 2, node.y + 2, 22 * zoom, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20 * zoom, 0, 2 * Math.PI);
      const nodeGradient = ctx.createRadialGradient(
        node.x - 5, node.y - 5, 0,
        node.x, node.y, 20 * zoom
      );
      if (node.type === 'user') {
        nodeGradient.addColorStop(0, '#c9a227');
        nodeGradient.addColorStop(1, '#a68523');
      } else {
        nodeGradient.addColorStop(0, '#1a1a1a');
        nodeGradient.addColorStop(1, '#0a0a0a');
      }
      ctx.fillStyle = nodeGradient;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `${11 * zoom}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(node.label || `Node ${node.id}`, node.x, node.y + 38 * zoom);
    });

  }, [networkData, zoom]);

  const stats = networkData as any;

  const statCards = [
    { label: "Total Nodes", value: networkData?.nodes?.length || 0, icon: Users },
    { label: "Connections", value: networkData?.edges?.length || 0, icon: Share2 },
    { label: "Communities", value: stats?.stats?.clusters || 0, icon: Layers },
    { label: "Avg Connections", value: stats?.stats?.avgDegree?.toFixed(1) || 0, icon: NetworkIcon },
  ];

  return (
    <div className="min-h-screen bg-background bg-geometric">
      {/* Header */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="geo-dot" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Network Intelligence</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
              Relationship <span className="gradient-text">Graph</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Visualize and analyze your network connections.
            </p>
          </div>
          
          <div className="flex items-center gap-3 animate-fade-in stagger-2">
            <Button variant="ghost" size="icon" className="p-3" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-medium">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="p-3" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="p-3">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="p-3" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in stagger-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              className="pl-11 h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in stagger-4">
          {statCards.map((stat, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl icon-container-accent flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
              </div>
              <div className="text-number-lg text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Visualization */}
      <div className="px-8 pb-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden animate-fade-in stagger-5">
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-accent mb-3" />
                  <p className="text-muted-foreground">Loading network...</p>
                </div>
              </div>
            ) : !networkData?.nodes?.length ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl icon-container mx-auto mb-6 flex items-center justify-center">
                    <NetworkIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No Network Data</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Add relationships to build your network graph
                  </p>
                </div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-[500px]"
                style={{ background: '#fafaf8' }}
              />
            )}
          </div>

          {/* Network Analytics Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm animate-fade-in stagger-6">
              <h3 className="text-lg font-semibold text-foreground mb-5">Analytics</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Density</span>
                    <span className="font-semibold">{((stats?.stats?.density || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${(stats?.stats?.density || 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Clustering</span>
                    <span className="font-semibold">{((stats?.stats?.clustering || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(stats?.stats?.clustering || 0) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Centrality</span>
                    <span className="font-semibold">{((stats?.stats?.centrality || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${(stats?.stats?.centrality || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm animate-fade-in stagger-7">
              <h3 className="text-lg font-semibold text-foreground mb-4">Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-accent" />
                  <span className="text-sm">Your Contacts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="text-sm">Extended Network</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-0.5 bg-accent/50" />
                  <span className="text-sm">Connection</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm animate-fade-in stagger-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Connectors</h3>
              {stats?.topConnectors?.length ? (
                <div className="space-y-3">
                  {stats.topConnectors.slice(0, 5).map((connector: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium">{connector.name || `User ${connector.id}`}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{connector.connections}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Insights */}
      <div className="px-8 pb-12">
        <Card className="animate-fade-in stagger-8 border-0 bg-primary text-primary-foreground">
          <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary-foreground mb-2">Network Intelligence</h3>
              <p className="text-primary-foreground/70 leading-relaxed">
                Your network shows strong clustering patterns with potential for expansion. 
                Consider leveraging your top connectors to access new communities and strengthen 
                your position as a key intermediary in the network.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
