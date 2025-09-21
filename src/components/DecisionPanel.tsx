import { Decision } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, X, Clock, Route, Zap, Calendar } from 'lucide-react';
import { useState } from 'react';

interface DecisionPanelProps {
  decisions: Decision[];
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const typeIcons = {
  priority: Zap,
  routing: Route,
  scheduling: Calendar
};

const typeColors = {
  priority: 'text-rail-danger',
  routing: 'text-rail-info', 
  scheduling: 'text-rail-warning'
};

export default function DecisionPanel({ decisions, onAccept, onReject }: DecisionPanelProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const rejectionReasons = [
    { value: 'safety', label: 'Safety Concerns' },
    { value: 'special_service', label: 'Special Service Requirements' },
    { value: 'local_knowledge', label: 'Local Knowledge Override' },
    { value: 'other', label: 'Other' }
  ];

  const handleRejectClick = (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedDecisionId && rejectionReason) {
      onReject(selectedDecisionId, rejectionReason);
      setRejectDialogOpen(false);
      setSelectedDecisionId('');
      setRejectionReason('');
    }
  };

  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const processedDecisions = decisions.filter(d => d.status !== 'pending');

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {/* Pending Decisions */}
      {pendingDecisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pending Approval ({pendingDecisions.length})
          </h3>
          
          {pendingDecisions.map((decision) => {
            const Icon = typeIcons[decision.type];
            return (
              <Card key={decision.id} className="rail-card border-rail-warning/20">
                <div className="flex items-start gap-3 mb-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${typeColors[decision.type]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {decision.type}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Confidence: <span className="text-rail-info font-medium">
                          {Math.round(decision.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">{decision.description}</p>
                    <p className="text-sm text-muted-foreground">{decision.impact}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Time Saved</div>
                    <div className="text-sm font-bold text-rail-success">
                      {decision.estimatedTimeSaving} min
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAccept(decision.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectClick(decision.id)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Decisions */}
      {processedDecisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Recent Decisions
          </h3>
          
          {processedDecisions.map((decision) => {
            const Icon = typeIcons[decision.type];
            const isAccepted = decision.status === 'accepted';
            
            return (
              <Card key={decision.id} className={`rail-card ${isAccepted ? 'success-card' : 'border-rail-danger/20'}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${typeColors[decision.type]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {decision.type}
                      </Badge>
                      <Badge variant={isAccepted ? "default" : "destructive"}>
                        {decision.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{decision.description}</p>
                    <p className="text-xs text-muted-foreground">{decision.impact}</p>
                  </div>
                  
                  {isAccepted && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Saved</div>
                      <div className="text-sm font-bold text-rail-success">
                        {decision.estimatedTimeSaving} min
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {decisions.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No decisions pending</p>
          <p className="text-sm text-muted-foreground mt-1">AI will recommend optimizations as needed</p>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please select the primary reason for rejecting this AI decision. This helps improve future recommendations.
            </p>
            
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select rejection reason" />
              </SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRejectConfirm}
                disabled={!rejectionReason}
                className="flex-1"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}