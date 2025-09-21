import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DecisionPanel from '@/components/DecisionPanel';
import { mockDecisions } from '@/data/mockData';
import { Monitor, Settings, Brain, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

const AIDecisions = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from FastAPI backend
  useEffect(() => {
    fetch("http://127.0.0.1:8000/aidecisions")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched decisions:", data);
        setDecisions(data.decisions || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend not available, using mock data", err);
        setDecisions(mockDecisions);
        setLoading(false);
      });
  }, []);

  // Listen for live updates over WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/decisions");

    socket.onopen = () => {
      console.log("WebSocket connected for decisions");
    };

    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log("Decision update:", update);

      setDecisions(prev => {
        const existingIndex = prev.findIndex(d => d.id === update.id);
        if (existingIndex >= 0) {
          // Update existing decision
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...update };
          return updated;
        } else {
          // Add new decision
          return [...prev, update];
        }
      });
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => socket.close();
  }, []);

  const handleAcceptDecision = (id: string) => {
    setDecisions(prev => prev.map(decision => 
      decision.id === id ? { ...decision, status: 'accepted' as const } : decision
    ));
  };

  const handleRejectDecision = (id: string) => {
    setDecisions(prev => prev.map(decision => 
      decision.id === id ? { ...decision, status: 'rejected' as const } : decision
    ));
  };

  const pendingCount = decisions.filter(d => d.status === 'pending').length;
  const acceptedCount = decisions.filter(d => d.status === 'accepted').length;
  const rejectedCount = decisions.filter(d => d.status === 'rejected').length;
  const totalTimeSaved = decisions
    .filter(d => d.status === 'accepted')
    .reduce((sum, d) => sum + d.estimatedTimeSaving, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rail-info flex items-center justify-center">
                <span className="text-background font-bold">R</span>
              </div>
              <span className="text-xl font-bold">Railvision</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <Monitor className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/ml-predictions">
                  <Brain className="w-4 h-4 mr-2" />
                  ML Predictions
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link to="/ai-decisions">
                  <Zap className="w-4 h-4 mr-2" />
                  AI Decisions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/sandbox">
                  <Settings className="w-4 h-4 mr-2" />
                  Sandbox
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* AI Decisions Page */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rail-info to-rail-warning flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Decision Engine</h1>
              <p className="text-muted-foreground">Intelligent traffic optimization and conflict resolution</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="rail-card">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rail-warning" />
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold text-rail-warning">{pendingCount}</div>
                </div>
              </div>
            </Card>
            
            <Card className="rail-card">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-rail-success" />
                <div>
                  <div className="text-sm text-muted-foreground">Accepted</div>
                  <div className="text-2xl font-bold text-rail-success">{acceptedCount}</div>
                </div>
              </div>
            </Card>
            
            <Card className="rail-card">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rail-danger" />
                <div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                  <div className="text-2xl font-bold text-rail-danger">{rejectedCount}</div>
                </div>
              </div>
            </Card>
            
            <Card className="rail-card">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rail-info"></div>
                <div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                  <div className="text-2xl font-bold text-rail-info">{totalTimeSaved}min</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Decisions Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Decisions */}
          <Card className="rail-card">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-rail-warning" />
              <h2 className="text-xl font-semibold">Active Decisions</h2>
              <Badge variant="outline" className="rail-pulse">LIVE</Badge>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rail-info mx-auto mb-3"></div>
                <p className="text-muted-foreground">Loading decisions...</p>
              </div>
            ) : (
              <DecisionPanel 
                decisions={decisions}
                onAccept={handleAcceptDecision}
                onReject={handleRejectDecision}
              />
            )}
          </Card>

          {/* Decision Analytics */}
          <Card className="rail-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-rail-warning to-rail-info"></div>
              <h2 className="text-xl font-semibold">Decision Analytics</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-rail-success/10 border border-rail-success/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-success">Success Rate</div>
                  <Badge className="bg-rail-success/20 text-rail-success">
                    {acceptedCount > 0 ? Math.round((acceptedCount / (acceptedCount + rejectedCount)) * 100) : 0}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Percentage of accepted decisions
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-rail-info/10 border border-rail-info/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-info">Total Impact</div>
                  <Badge className="bg-rail-info/20 text-rail-info">
                    {totalTimeSaved} minutes
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cumulative time savings from accepted decisions
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-rail-warning/10 border border-rail-warning/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-warning">Response Time</div>
                  <Badge className="bg-rail-warning/20 text-rail-warning">~2.3s</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Average AI decision generation time
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Decision Types Breakdown */}
        <Card className="rail-card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-rail-neutral"></div>
            <h2 className="text-xl font-semibold">Decision Types Analysis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['priority', 'routing', 'scheduling'].map((type) => {
              const typeDecisions = decisions.filter(d => d.type === type);
              const typeAccepted = typeDecisions.filter(d => d.status === 'accepted').length;
              const typePending = typeDecisions.filter(d => d.status === 'pending').length;
              
              return (
                <div key={type} className="p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-medium capitalize">{type} Decisions</div>
                    <Badge variant="outline">{typeDecisions.length} total</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Accepted:</span>
                      <span className="text-rail-success font-medium">{typeAccepted}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pending:</span>
                      <span className="text-rail-warning font-medium">{typePending}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="text-rail-info font-medium">
                        {typeDecisions.length > typePending ? 
                          Math.round((typeAccepted / (typeDecisions.length - typePending)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 rounded bg-muted/50">
                    <div className="text-xs font-medium mb-1">Latest Decision:</div>
                    <div className="text-xs text-muted-foreground">
                      {typeDecisions[0]?.description.substring(0, 60)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIDecisions;
