import { Train } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Gauge, MapPin } from 'lucide-react';

interface TrainStatusCardProps {
  train: Train;
}

const statusConfig = {
  'on-time': { color: 'bg-status-on-time', label: 'On Time', class: 'status-on-time' },
  'delayed': { color: 'bg-status-delayed', label: 'Delayed', class: 'status-delayed' },
  'critical': { color: 'bg-status-critical', label: 'Critical', class: 'status-critical' },
  'maintenance': { color: 'bg-status-maintenance', label: 'Maintenance', class: 'border-status-maintenance' }
};

const typeConfig = {
  'express': { color: 'bg-rail-info', label: 'Express' },
  'freight': { color: 'bg-rail-neutral', label: 'Freight' },
  'local': { color: 'bg-rail-warning', label: 'Local' }
};

export default function TrainStatusCard({ train }: TrainStatusCardProps) {
  const status = statusConfig[train.status];
  const type = typeConfig[train.type];

  return (
    <Card className="rail-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`status-indicator ${status.class}`} />
          <div>
            <h3 className="font-semibold text-foreground">{train.name}</h3>
            <p className="text-sm text-muted-foreground">{train.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={`${type.color} text-background border-0`}>
            {type.label}
          </Badge>
          <Badge variant={train.status === 'critical' ? 'destructive' : 'secondary'}>
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rail-info" />
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-sm font-medium">{train.currentLocation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rail-neutral" />
          <div>
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="text-sm font-medium">{train.destination}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-rail-neutral" />
          <div>
            <p className="text-xs text-muted-foreground">Schedule</p>
            <p className="font-medium">{train.scheduledTime}</p>
            {train.delayMinutes > 0 && (
              <p className="text-xs text-rail-warning">+{train.delayMinutes}min</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-rail-info" />
          <div>
            <p className="text-xs text-muted-foreground">Speed</p>
            <p className="font-medium">{train.speed.toFixed(2)} km/h</p>
          </div>
        </div>

        {train.passengers && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rail-success" />
            <div>
              <p className="text-xs text-muted-foreground">Passengers</p>
              <p className="font-medium">{train.passengers}</p>
            </div>
          </div>
        )}
      </div>

      {train.delayMinutes > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Actual Time:</span>
            <span className="text-sm font-medium text-rail-warning">{train.actualTime}</span>
          </div>
        </div>
      )}
    </Card>
  );
}