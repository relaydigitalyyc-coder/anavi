import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, Search, ZoomIn, ZoomOut, Maximize2, Filter,
  User, Building2, Briefcase, Calendar, MessageSquare, Tag,
  Phone, Mail, MapPin, Clock, ArrowRight, ExternalLink
} from 'lucide-react';

// Node types for the knowledge graph
export type NodeType = 'person' | 'company' | 'deal' | 'meeting' | 'topic' | 'action';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  data?: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  strength?: number;
  label?: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
  className?: string;
}

const nodeColors: Record<NodeType, string> = {
  person: '#38BDF8',  // Sky blue
  company: '#0284C7',  // Darker sky blue
  deal: '#0EA5E9',    // Sky blue 500
  meeting: '#7DD3FC', // Light sky blue
  topic: '#64748B',   // Slate
  action: '#475569',  // Slate darker
};

const nodeIcons: Record<NodeType, React.ElementType> = {
  person: User,
  company: Building2,
  deal: Briefcase,
  meeting: Calendar,
  topic: Tag,
  action: MessageSquare,
};

export function KnowledgeGraph({
  nodes,
  links,
  onNodeClick,
  onNodeDoubleClick,
  width = 800,
  height = 600,
  className = '',
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypes, setFilterTypes] = useState<NodeType[]>([]);
  const [dimensions, setDimensions] = useState({ width, height });

  // Filter nodes based on search and type filters
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = searchQuery === '' || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTypes.length === 0 || filterTypes.includes(node.type);
    return matchesSearch && matchesFilter;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: w, height: h } = dimensions;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Create arrow markers for links
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#94A3B8')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(filteredLinks)
        .id((d: any) => d.id)
        .distance(100)
        .strength((d: any) => d.strength || 0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', '#94A3B8')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.strength || 1) * 2)
      .attr('marker-end', 'url(#arrow)');

    // Create link labels
    const linkLabel = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(filteredLinks)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748B')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.label || d.type);

    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add node circles with glow effect
    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: GraphNode) => nodeColors[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.3))');

    // Add node icons (as text for simplicity)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d: GraphNode) => d.label.charAt(0).toUpperCase());

    // Add node labels
    node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#1F2937')
      .attr('font-weight', '500')
      .text((d: GraphNode) => d.label.length > 15 ? d.label.slice(0, 15) + '...' : d.label);

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 25)
        .style('filter', 'drop-shadow(0 0 12px rgba(0,0,0,0.5))');
      setHoveredNode(d);
    })
    .on('mouseleave', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 20)
        .style('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.3))');
      setHoveredNode(null);
    })
    .on('click', (event, d) => {
      setSelectedNode(d);
      onNodeClick?.(d);
    })
    .on('dblclick', (event, d) => {
      onNodeDoubleClick?.(d);
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, dimensions, onNodeClick, onNodeDoubleClick]);

  const toggleFilter = (type: NodeType) => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        1.3
      );
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        0.7
      );
    }
  };

  const resetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-8 text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg max-w-xs">
          {(Object.keys(nodeColors) as NodeType[]).map(type => (
            <Badge
              key={type}
              variant={filterTypes.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer capitalize text-xs"
              style={{ 
                backgroundColor: filterTypes.includes(type) ? nodeColors[type] : 'transparent',
                borderColor: nodeColors[type],
                color: filterTypes.includes(type) ? '#fff' : nodeColors[type]
              }}
              onClick={() => toggleFilter(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Graph canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg"
      />

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-16 w-80 z-20"
          >
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: nodeColors[selectedNode.type] }}
                    >
                      {(() => {
                        const Icon = nodeIcons[selectedNode.type];
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
                      <Badge variant="outline" className="capitalize text-xs mt-1">
                        {selectedNode.type}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {selectedNode.data && (
                  <div className="space-y-3">
                    {selectedNode.data.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedNode.data.email}</span>
                      </div>
                    )}
                    {selectedNode.data.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedNode.data.phone}</span>
                      </div>
                    )}
                    {selectedNode.data.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedNode.data.company}</span>
                      </div>
                    )}
                    {selectedNode.data.date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(selectedNode.data.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedNode.data.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedNode.data.description}
                      </p>
                    )}
                    {selectedNode.data.actionItems && selectedNode.data.actionItems.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">Action Items</h4>
                        <ul className="space-y-1">
                          {selectedNode.data.actionItems.slice(0, 3).map((item: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Connected nodes */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Connections</h4>
                  <div className="flex flex-wrap gap-1">
                    {links
                      .filter(l => {
                        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                        return sourceId === selectedNode.id || targetId === selectedNode.id;
                      })
                      .slice(0, 5)
                      .map((link, i) => {
                        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                        const connectedId = sourceId === selectedNode.id ? targetId : sourceId;
                        const connectedNode = nodes.find(n => n.id === connectedId);
                        if (!connectedNode) return null;
                        return (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => setSelectedNode(connectedNode)}
                          >
                            {connectedNode.label}
                          </Badge>
                        );
                      })}
                  </div>
                </div>

                <Button className="w-full mt-4" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNode && !selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 z-10"
          >
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: nodeColors[hoveredNode.type] }}
                >
                  {hoveredNode.label.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm">{hoveredNode.label}</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {hoveredNode.type}
                </Badge>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Legend</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {(Object.keys(nodeColors) as NodeType[]).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nodeColors[type] }}
              />
              <span className="text-xs capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{filteredNodes.length}</strong> nodes</span>
          <span><strong className="text-foreground">{filteredLinks.length}</strong> connections</span>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeGraph;
