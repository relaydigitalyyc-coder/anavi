import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Handshake, Heart, X, MessageSquare, Shield, 
  Clock, Sparkles, ArrowRight, CheckCircle2, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Matches() {
  const [, setLocation] = useLocation();
  const { data: matches, isLoading, refetch } = trpc.match.list.useQuery();
  
  const expressInterestMutation = trpc.match.expressInterest.useMutation({
    onSuccess: (data) => {
      if (data.mutualInterest) {
        toast.success("Mutual interest! You can now create a deal room.");
      } else {
        toast.success("Interest expressed. Waiting for counterparty response.");
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createDealRoomMutation = trpc.match.createDealRoom.useMutation({
    onSuccess: () => {
      toast.success("Deal room created!");
      setLocation("/deal-rooms");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-sky-100 text-sky-700";
      case "user1_interested": 
      case "user2_interested": return "bg-blue-100 text-blue-700";
      case "mutual_interest": return "bg-sky-100 text-sky-700";
      case "deal_room_created": return "bg-primary text-primary-foreground";
      case "declined": return "bg-red-100 text-red-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string, isUser1: boolean) => {
    switch (status) {
      case "pending": return "Awaiting Response";
      case "user1_interested": return isUser1 ? "You Expressed Interest" : "They're Interested";
      case "user2_interested": return !isUser1 ? "You Expressed Interest" : "They're Interested";
      case "mutual_interest": return "Mutual Interest!";
      case "deal_room_created": return "Deal Room Active";
      case "declined": return "Declined";
      default: return status;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-rose-600" />
            </div>
            AI Matches
          </h1>
          <p className="text-muted-foreground mt-2">
            Compatible counterparties found by our AI matching engine
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Matches</div>
                <div className="text-3xl font-bold number-display">{matches?.length || 0}</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Pending</div>
                <div className="text-3xl font-bold number-display text-sky-600">
                  {matches?.filter(m => m.status === 'pending').length || 0}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Mutual Interest</div>
                <div className="text-3xl font-bold number-display text-sky-600">
                  {matches?.filter(m => m.status === 'mutual_interest').length || 0}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                <Heart className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Deal Rooms</div>
                <div className="text-3xl font-bold number-display text-primary">
                  {matches?.filter(m => m.status === 'deal_room_created').length || 0}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="h-40 animate-shimmer rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !matches || matches.length === 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create intents and our AI will find compatible counterparties
            </p>
            <Button onClick={() => setLocation("/intents")}>
              Create Intent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match, index) => {
            const isUser1 = true;
            const hasExpressedInterest = isUser1 ? match.user1Consent : match.user2Consent;
            const compatibilityScore = parseFloat(match.compatibilityScore || "0");

            return (
              <Card 
                key={match.id} 
                className="border-border/60 shadow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${getStatusStyle(match.status || 'pending')} border-0`}>
                          {getStatusLabel(match.status || 'pending', isUser1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Match #{match.id}
                        </span>
                      </div>

                      {/* Compatibility Score */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Compatibility Score</span>
                          <span className="text-xl font-bold text-primary">{compatibilityScore}%</span>
                        </div>
                        <Progress value={compatibilityScore} className="h-2" />
                      </div>

                      {/* Match Reason */}
                      {match.matchReason && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/10 mb-5">
                          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            AI Analysis
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{match.matchReason}</p>
                        </div>
                      )}

                      {/* Intent Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-border bg-card">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">Your Intent</div>
                          <div className="font-semibold">Intent #{match.intent1Id}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-border bg-card">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">Their Intent</div>
                          <div className="font-semibold">Intent #{match.intent2Id}</div>
                          {match.status === 'mutual_interest' || match.status === 'deal_room_created' ? (
                            <Badge className="mt-2 bg-sky-100 text-sky-700 hover:bg-sky-100 border-0">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mt-2 bg-muted text-muted-foreground">
                              Anonymous
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Matched {new Date(match.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {match.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => expressInterestMutation.mutate({ matchId: match.id })}
                            disabled={expressInterestMutation.isPending}
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Express Interest
                          </Button>
                          <Button variant="outline" className="hover:border-red-300 hover:text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}

                      {(match.status === 'user1_interested' || match.status === 'user2_interested') && !hasExpressedInterest && (
                        <>
                          <Button
                            onClick={() => expressInterestMutation.mutate({ matchId: match.id })}
                            disabled={expressInterestMutation.isPending}
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Express Interest
                          </Button>
                          <Button variant="outline" className="hover:border-red-300 hover:text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}

                      {(match.status === 'user1_interested' || match.status === 'user2_interested') && hasExpressedInterest && (
                        <div className="text-center p-5 rounded-xl bg-muted/30 border border-border">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-sky-500 mb-2" />
                          <p className="text-sm font-medium">Waiting for response...</p>
                        </div>
                      )}

                      {match.status === 'mutual_interest' && (
                        <>
                          <Button
                            onClick={() => createDealRoomMutation.mutate({ matchId: match.id })}
                            disabled={createDealRoomMutation.isPending}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Create Deal Room
                          </Button>
                          <Button variant="outline" className="hover:border-primary hover:text-primary">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </>
                      )}

                      {match.status === 'deal_room_created' && match.dealRoomId && (
                        <Button
                          onClick={() => setLocation(`/deal-rooms`)}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Go to Deal Room
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
