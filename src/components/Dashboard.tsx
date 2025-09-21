import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TrainStatusCard from './TrainStatusCard';
import RailwayMap from './RailwayMap';
import AlertsPanel from './AlertsPanel';
import DelayTrend from './DelayTrend';
import { 
  mockTrains, 
  mockRailwaySegments, 
  mockAlerts,
  Train
} from '@/data/mockData';
import { Activity } from 'lucide-react';

interface DashboardProps {
  filteredTrains?: any[];
  onAreaChange?: (area: string) => void;
}

export default function Dashboard({ filteredTrains, onAreaChange }: DashboardProps) {
  const [trains, setTrains] = useState(mockTrains);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use filtered trains if provided, otherwise use all trains
  const displayTrains = filteredTrains && filteredTrains.length > 0 ? filteredTrains : trains;
  // Update time every second for real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sound alert for critical situations (single beep on mount if any critical)
  useEffect(() => {
    const hasCritical = mockAlerts.some(a => a.severity === 'critical');
    if (!hasCritical) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      o.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  // Simulate real-time train updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrains(prev => prev.map(train => ({
        ...train,
        // Simulate small position changes for moving trains
        position: train.speed > 0 ? [
          train.position[0] + (Math.random() - 0.5) * 0.001,
          train.position[1] + (Math.random() - 0.5) * 0.001
        ] as [number, number] : train.position,
        // Simulate slight speed variations
        speed: train.status === 'critical' ? 0 : 
               train.speed + (Math.random() - 0.5) * 5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const onTimeTrains = trains.filter(t => t.status === 'on-time').length;
  const delayedTrains = trains.filter(t => t.status === 'delayed').length;
  const criticalTrains = trains.filter(t => t.status === 'critical').length;
  const totalPassengers = trains.reduce((sum, train) => sum + (train.passengers || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Railway Traffic Control System
            </h1>
            <p className="text-muted-foreground">
              Real-time AI-powered decision engine • {currentTime.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex gap-4">
            <Card className="rail-card px-4 py-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rail-success" />
                <div>
                  <div className="text-sm text-muted-foreground">System Status</div>
                  <div className="text-lg font-bold text-rail-success">OPERATIONAL</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="rail-card">
            <div className="flex items-center gap-3">
              <div className="status-indicator status-on-time"></div>
              <div>
                <div className="text-2xl font-bold text-rail-success">{onTimeTrains}</div>
                <div className="text-sm text-muted-foreground">On Time</div>
              </div>
            </div>
          </Card>
          
          <Card className="rail-card">
            <div className="flex items-center gap-3">
              <div className="status-indicator status-delayed"></div>
              <div>
                <div className="text-2xl font-bold text-rail-warning">{delayedTrains}</div>
                <div className="text-sm text-muted-foreground">Delayed</div>
              </div>
            </div>
          </Card>
          
          <Card className="rail-card">
            <div className="flex items-center gap-3">
              <div className="status-indicator status-critical"></div>
              <div>
                <div className="text-2xl font-bold text-rail-danger">{criticalTrains}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </div>
          </Card>
          
          <Card className="rail-card">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rail-info"></div>
              <div>
                <div className="text-2xl font-bold text-rail-info">{totalPassengers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Passengers</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Delay Trend */}
        <div className="mb-6 animate-fade-in">
          <DelayTrend trains={trains} />
        </div>
      </div>

      {/* Main Dashboard Grid - Following Wireframe Layout */}
      
      {/* Top Row: Live Train | System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Live Train */}
        <Card className="rail-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-rail-info" />
            <h2 className="text-lg font-semibold">Live Train</h2>
            <Badge variant="outline" className="rail-pulse">LIVE</Badge>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {trains.map(train => (
              <TrainStatusCard key={train.id} train={train} />
            ))}
          </div>
        </Card>

        {/* System Alerts */}
        <Card className="rail-card">
          <AlertsPanel alerts={mockAlerts} trains={trains} />
        </Card>
      </div>

      {/* Enhanced Network Map - Now Full Width */}
      <Card className="rail-card p-0 overflow-hidden">
        <div className="p-4 pb-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-rail-info"></div>
            <h2 className="text-xl font-semibold">Interactive Network Map</h2>
            <Badge variant="outline">Live Tracking</Badge>
          </div>
        </div>
        <RailwayMap 
          trains={trains} 
          segments={mockRailwaySegments}
          className="h-96 lg:h-[500px]"
          showAreaSelection={true}
          onAreaChange={onAreaChange}
        />
      </Card>
    </div>
  );
}