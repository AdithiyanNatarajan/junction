import { Alert, Train } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, AlertCircle, Wrench, Shield, CheckCircle } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  trains: Train[];
}

const alertIcons = {
  delay: Clock,
  conflict: AlertTriangle,
  safety: Shield,
  maintenance: Wrench
};

const severityColors = {
  low: 'text-rail-info',
  medium: 'text-rail-warning',
  high: 'text-rail-danger',
  critical: 'text-red-500'
};

// Function to get alert styling based on type and severity
const getAlertStyle = (type: Alert['type'], severity: Alert['severity']) => {
  // For safety alerts, only show green for low/medium severity (actual safe conditions)
  // High/Critical safety alerts are emergencies and should be red
  if (type === 'safety') {
    if (severity === 'critical' || severity === 'high') {
      return {
        bg: 'bg-rail-danger/20',
        border: 'border-rail-danger border-l-4',
        icon: 'text-rail-danger',
        glow: 'shadow-[0_0_20px_hsl(var(--rail-danger)/0.4)]',
        badge: 'bg-rail-danger text-background'
      };
    } else {
      return {
        bg: 'bg-rail-success/20',
        border: 'border-rail-success border-l-4',
        icon: 'text-rail-success',
        glow: 'shadow-[0_0_20px_hsl(var(--rail-success)/0.4)]',
        badge: 'bg-rail-success text-background'
      };
    }
  }
  
  // Default colors for other types
  const typeColors = {
    delay: {
      bg: 'bg-rail-warning/20',
      border: 'border-rail-warning border-l-4',
      icon: 'text-rail-warning',
      glow: 'shadow-[0_0_20px_hsl(var(--rail-warning)/0.4)]',
      badge: 'bg-rail-warning text-background'
    },
    conflict: {
      bg: 'bg-rail-danger/20',
      border: 'border-rail-danger border-l-4',
      icon: 'text-rail-danger',
      glow: 'shadow-[0_0_20px_hsl(var(--rail-danger)/0.4)]',
      badge: 'bg-rail-danger text-background'
    },
    maintenance: {
      bg: 'bg-rail-info/20',
      border: 'border-rail-info border-l-4',
      icon: 'text-rail-info',
      glow: 'shadow-[0_0_20px_hsl(var(--rail-info)/0.4)]',
      badge: 'bg-rail-info text-background'
    }
  };
  
  return typeColors[type] || typeColors.maintenance;
};

const severityBadges = {
  low: 'default',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive'
} as const;

export default function AlertsPanel({ alerts, trains }: AlertsPanelProps) {
  // Calculate train status counts
  const onTimeCount = trains.filter(t => t.status === 'on-time').length;
  const delayedCount = trains.filter(t => t.status === 'delayed').length;
  const criticalTrainCount = trains.filter(t => t.status === 'critical').length;
  
  // Sort alerts by severity and timestamp
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const criticalAlertCount = alerts.filter(a => a.severity === 'critical').length;
  const highAlertCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rail-warning" />
            <h2 className="text-lg font-semibold">System Alerts</h2>
          </div>
          
          <div className="flex gap-2">
            {criticalAlertCount > 0 && (
              <Badge variant="destructive" className="rail-blink">
                {criticalAlertCount} Critical
              </Badge>
            )}
            {highAlertCount > 0 && (
              <Badge variant="destructive">
                {highAlertCount} High
              </Badge>
            )}
          </div>
        </div>
        
        {/* Train Status Summary */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Trains:</span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-rail-success" />
            <Badge className="bg-rail-success/20 text-rail-success border-rail-success">
              {onTimeCount} On-time
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rail-warning" />
            <Badge className="bg-rail-warning/20 text-rail-warning border-rail-warning">
              {delayedCount} Delayed
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rail-danger" />
            <Badge className="bg-rail-danger/20 text-rail-danger border-rail-danger">
              {criticalTrainCount} Critical
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const typeStyle = getAlertStyle(alert.type, alert.severity);
          const isBlinking = alert.severity === 'critical';
          
          return (
            <Card 
              key={alert.id} 
              className={`rail-card border-2 transition-all duration-300 ${typeStyle.bg} ${typeStyle.border} ${typeStyle.glow} ${
                isBlinking ? 'rail-blink' : 'hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${typeStyle.icon} ${
                  isBlinking ? 'rail-blink' : 'rail-pulse'
                }`} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={severityBadges[alert.severity]} className="capitalize">
                      {alert.severity}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`capitalize border-current ${typeStyle.icon}`}
                    >
                      {alert.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {alert.timestamp}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>📍 {alert.location}</span>
                    {alert.trainId && (
                      <span>🚂 {alert.trainId}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {alert.severity === 'critical' && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className={`flex items-center gap-2 text-xs ${typeStyle.icon}`}>
                    <AlertCircle className="w-3 h-3 rail-blink" />
                    <span className="font-medium">Immediate action required</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <Card className="rail-card text-center py-8">
          <Shield className="w-12 h-12 text-rail-success mx-auto mb-3" />
          <p className="text-rail-success font-medium">All Systems Normal</p>
          <p className="text-sm text-muted-foreground mt-1">No active alerts</p>
        </Card>
      )}
    </div>
  );
}