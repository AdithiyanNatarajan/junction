import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RailwayMap from '@/components/RailwayMap';
import { mockTrains, mockRailwaySegments, Train, RailwaySegment } from '@/data/mockData';
import { 
  Play, 
  RotateCcw, 
  Settings, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  Monitor
} from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string;
  modifications: {
    trainDelays?: { trainId: string; delay: number }[];
    blockedSegments?: string[];
    priorityChanges?: { trainId: string; priority: number }[];
  };
}

const scenarios: Scenario[] = [
  {
    id: 'normal',
    name: 'Normal Operations',
    description: 'Standard operating conditions with current schedule',
    modifications: {}
  },
  {
    id: 'emergency',
    name: 'Emergency Stop',
    description: 'Train LOC-78 emergency stop - test system response',
    modifications: {
      trainDelays: [{ trainId: 'LOC-78', delay: 45 }],
      blockedSegments: ['seg-3']
    }
  },
  {
    id: 'priority',
    name: 'Express Priority',
    description: 'High-priority express train needs immediate passage',
    modifications: {
      priorityChanges: [{ trainId: 'EXP-101', priority: 15 }],
      trainDelays: [{ trainId: 'FRT-203', delay: 20 }]
    }
  },
  {
    id: 'maintenance',
    name: 'Track Maintenance',
    description: 'Planned maintenance blocks main line - rerouting required',
    modifications: {
      blockedSegments: ['seg-1', 'seg-2'],
      trainDelays: [
        { trainId: 'EXP-101', delay: 12 },
        { trainId: 'FRT-203', delay: 25 }
      ]
    }
  }
];

export default function Sandbox() {
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [modifiedTrains, setModifiedTrains] = useState<Train[]>(mockTrains);
  const [modifiedSegments, setModifiedSegments] = useState<RailwaySegment[]>(mockRailwaySegments);
  const [results, setResults] = useState<any>(null);

  const runSimulation = () => {
    setSimulationRunning(true);
    
    const scenario = scenarios.find(s => s.id === selectedScenario);
    if (!scenario) return;

    // Apply scenario modifications
    const updatedTrains = mockTrains.map(train => {
      let updatedTrain = { ...train };
      
      // Apply delays
      const delayMod = scenario.modifications.trainDelays?.find(d => d.trainId === train.id);
      if (delayMod) {
        updatedTrain.delayMinutes = delayMod.delay;
        updatedTrain.status = delayMod.delay > 30 ? 'critical' : 
                            delayMod.delay > 10 ? 'delayed' : 'on-time';
        
        // Calculate new actual time
        const scheduled = new Date(`2024-01-01 ${train.scheduledTime}`);
        const actual = new Date(scheduled.getTime() + delayMod.delay * 60000);
        updatedTrain.actualTime = actual.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }

      // Apply priority changes
      const priorityMod = scenario.modifications.priorityChanges?.find(p => p.trainId === train.id);
      if (priorityMod) {
        updatedTrain.priority = priorityMod.priority;
      }

      return updatedTrain;
    });

    setModifiedTrains(updatedTrains);

    // Call backend evaluation API
    fetch('http://127.0.0.1:8000/sandbox/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenario: selectedScenario,
        modifiedTrains: updatedTrains,
        modifiedSegments: modifiedSegments
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Sandbox evaluation result:', data);
      setResults(data);
      setSimulationRunning(false);
    })
    .catch(error => {
      console.error('Sandbox evaluation error:', error);
      // Fallback to local calculation
      const totalDelay = updatedTrains.reduce((sum, train) => sum + train.delayMinutes, 0);
      const affectedPassengers = updatedTrains
        .filter(train => train.delayMinutes > 0)
        .reduce((sum, train) => sum + (train.passengers || 0), 0);

      setResults({
        totalDelay,
        affectedTrains: updatedTrains.filter(t => t.delayMinutes > 0).length,
        affectedPassengers,
        recommendations: [
          `Reroute ${updatedTrains.filter(t => t.delayMinutes > 15).length} trains via alternate routes`,
          `Priority boarding for affected passengers (${affectedPassengers} total)`,
          `Estimated recovery time: ${Math.ceil(totalDelay / 10)} minutes`,
          `Suggested compensation: ${Math.round(affectedPassengers * 0.1)} vouchers`
        ]
      });
      setSimulationRunning(false);
    });
  };

  const resetSimulation = () => {
    setModifiedTrains(mockTrains);
    setModifiedSegments(mockRailwaySegments);
    setResults(null);
    setSelectedScenario('normal');
  };

  const handleTrainDrag = (trainId: string, newPosition: [number, number]) => {
    setModifiedTrains(prev => prev.map(train => 
      train.id === trainId 
        ? { ...train, position: newPosition }
        : train
    ));
  };

  const handleSegmentDrag = (segmentId: string, start: [number, number], end: [number, number]) => {
    setModifiedSegments(prev => prev.map(segment => 
      segment.id === segmentId 
        ? { ...segment, start, end }
        : segment
    ));
  };

  const currentScenario = scenarios.find(s => s.id === selectedScenario);

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
              <Button variant="outline" asChild>
                <Link to="/">
                  <Monitor className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/sandbox">
                  <Settings className="w-4 h-4 mr-2" />
                  Sandbox
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                What-If Simulation Sandbox
              </h1>
              <p className="text-muted-foreground">
                Test scenarios and analyze AI decision-making in real-time
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetSimulation}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={runSimulation} 
                disabled={simulationRunning}
                className="min-w-32"
              >
                {simulationRunning ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Control Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Scenario Selection */}
            <Card className="rail-card">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-rail-info" />
                <h2 className="text-lg font-semibold">Scenario Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Select Scenario
                  </label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map(scenario => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentScenario && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <h3 className="font-medium mb-2">{currentScenario.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentScenario.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Current Modifications */}
            {currentScenario && Object.keys(currentScenario.modifications).length > 0 && (
              <Card className="rail-card">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-rail-warning" />
                  <h2 className="text-lg font-semibold">Active Modifications</h2>
                </div>
                
                <div className="space-y-3">
                  {currentScenario.modifications.trainDelays && (
                    <div>
                      <h4 className="text-sm font-medium text-rail-warning mb-2">Train Delays</h4>
                      {currentScenario.modifications.trainDelays.map(delay => (
                        <div key={delay.trainId} className="flex justify-between text-sm">
                          <span>{delay.trainId}</span>
                          <span className="text-rail-warning">+{delay.delay} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {currentScenario.modifications.blockedSegments && (
                    <div>
                      <h4 className="text-sm font-medium text-rail-danger mb-2">Blocked Segments</h4>
                      {currentScenario.modifications.blockedSegments.map(segment => (
                        <Badge key={segment} variant="destructive" className="mr-1 mb-1">
                          {segment}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {currentScenario.modifications.priorityChanges && (
                    <div>
                      <h4 className="text-sm font-medium text-rail-info mb-2">Priority Changes</h4>
                      {currentScenario.modifications.priorityChanges.map(priority => (
                        <div key={priority.trainId} className="flex justify-between text-sm">
                          <span>{priority.trainId}</span>
                          <span className="text-rail-info">Priority: {priority.priority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Results Panel */}
            {results && (
              <Card className="rail-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-rail-success" />
                  <h2 className="text-lg font-semibold">Simulation Results</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rail-warning">
                        {results.totalDelay}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Delay (min)</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rail-danger">
                        {results.affectedTrains}
                      </div>
                      <div className="text-xs text-muted-foreground">Affected Trains</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rail-info">
                      {results.affectedPassengers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Affected Passengers</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      AI Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {results.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-xs text-muted-foreground">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Map Visualization */}
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-rail-info"></div>
              <h2 className="text-lg font-semibold">Interactive Network Map</h2>
              <Badge variant="outline">Drag & Drop Enabled</Badge>
              {simulationRunning && (
                <Badge variant="default" className="rail-pulse">
                  Simulating...
                </Badge>
              )}
            </div>
            
            <Card className="rail-card p-0 overflow-hidden">
              <RailwayMap 
                trains={modifiedTrains} 
                segments={modifiedSegments}
                className="h-[600px]"
                draggableMarkers={true}
                onTrainDrag={handleTrainDrag}
                draggableSegments={true}
                onSegmentDrag={handleSegmentDrag}
              />
            </Card>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              💡 Drag trains and track endpoints to modify the scenario interactively. Blue dots indicate draggable track endpoints.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}