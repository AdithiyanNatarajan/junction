import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PredictionPanel from '@/components/PredictionPanel';
import { mockPredictions } from '@/data/mockData';
import { Monitor, Settings, Brain, Zap } from 'lucide-react';

const MLPredictions = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch initial predictions from FastAPI
  useEffect(() => {
    fetch("http://127.0.0.1:8000/mlpredictions")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched predictions:", data);
        setPredictions(data.predictions || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend not available, using mock data", err);
        setPredictions(mockPredictions);
        setLoading(false);
      });
  }, []);

  // ✅ Listen for live updates via WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/predictions");

    socket.onopen = () => {
      console.log("WebSocket connected for predictions");
    };

    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log("Prediction update:", update);

      setPredictions(prev => {
        const existingIndex = prev.findIndex(p => p.trainId === update.trainId);
        if (existingIndex >= 0) {
          // Update existing prediction
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...update };
          return updated;
        } else {
          // Add new prediction
          return [...prev, update];
        }
      });
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => socket.close();
  }, []);

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
              <Button variant="default" asChild>
                <Link to="/ml-predictions">
                  <Brain className="w-4 h-4 mr-2" />
                  ML Predictions
                </Link>
              </Button>
              <Button variant="ghost" asChild>
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

      {/* ML Predictions Page */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rail-info to-rail-success flex items-center justify-center">
              <Brain className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Machine Learning Predictions</h1>
              <p className="text-muted-foreground">AI-powered delay predictions and optimization recommendations</p>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <Card className="rail-card px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rail-success"></div>
                <div>
                  <div className="text-sm text-muted-foreground">Model Accuracy</div>
                  <div className="text-lg font-bold text-rail-success">94.2%</div>
                </div>
              </div>
            </Card>
            
            <Card className="rail-card px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rail-info"></div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Predictions</div>
                  <div className="text-lg font-bold text-rail-info">{predictions.length}</div>
                </div>
              </div>
            </Card>
            
            <Card className="rail-card px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rail-warning"></div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  <div className="text-lg font-bold text-rail-warning">
                    {predictions.length > 0
                      ? Math.round(
                          (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 100
                        )
                      : 0}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Analytics and Prediction Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Analytics */}
          <Card className="rail-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-rail-success to-rail-info"></div>
              <h2 className="text-xl font-semibold">Analytics</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-rail-success/10 border border-rail-success/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-success">High Confidence</div>
                  <Badge className="bg-rail-success/20 text-rail-success border-rail-success/30">
                    {predictions.filter(p => p.confidence > 0.9).length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  &gt;90% accuracy
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-rail-warning/10 border border-rail-warning/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-warning">Major Delays</div>
                  <Badge className="bg-rail-warning/20 text-rail-warning border-rail-warning/30">
                    {predictions.filter(p => p.predictedDelay > 10).length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  &gt;10min delays
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-rail-danger/10 border border-rail-danger/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-danger">Critical Delays</div>
                  <Badge className="bg-rail-danger/20 text-rail-danger border-rail-danger/30">
                    {predictions.filter(p => p.predictedDelay > 20).length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  &gt;20min delays
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-rail-info/10 border border-rail-info/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-rail-info">Model Status</div>
                  <Badge className="bg-rail-info/20 text-rail-info border-rail-info/30">ACTIVE</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Learning continuously
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Prediction Factors */}
          <Card className="rail-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-rail-neutral"></div>
              <h2 className="text-xl font-semibold">Prediction Factors Analysis</h2>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rail-info mx-auto mb-3"></div>
                  <p className="text-muted-foreground">Loading predictions...</p>
                </div>
              ) : predictions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No predictions available</p>
                  <p className="text-sm text-muted-foreground mt-1">ML model will analyze incoming data</p>
                </div>
              ) : (
                predictions.map((prediction, index) => (
                <div key={index} className="p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-medium">Train {prediction.trainId}</div>
                    <Badge variant={prediction.confidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(prediction.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Predicted Delay:</span> {prediction.predictedDelay} minutes
                    </div>
                    
                    <div className="text-xs">
                      <span className="font-medium text-muted-foreground">Key Factors:</span>
                      <div className="mt-1 space-y-1">
                        {prediction.factors.map((factor: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rail-info"></div>
                            <span className="text-xs text-muted-foreground">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 rounded bg-rail-info/5 border border-rail-info/10">
                      <div className="text-xs font-medium text-rail-info mb-1">Recommendation:</div>
                      <div className="text-xs text-muted-foreground">{prediction.recommendation}</div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MLPredictions;
