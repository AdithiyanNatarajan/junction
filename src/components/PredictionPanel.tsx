import { Prediction } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface PredictionPanelProps {
  predictions: Prediction[];
}

export default function PredictionPanel({ predictions }: PredictionPanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-rail-success';
    if (confidence >= 0.7) return 'text-rail-warning';
    return 'text-rail-danger';
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 5) return 'text-rail-success';
    if (delay <= 15) return 'text-rail-warning';
    return 'text-rail-danger';
  };

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {predictions.map((prediction) => (
        <Card key={prediction.trainId} className="rail-card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{prediction.trainId}</h3>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="w-4 h-4 text-rail-info" />
                <span className={`text-sm font-medium ${getDelayColor(prediction.predictedDelay)}`}>
                  {prediction.predictedDelay > 0 ? `+${prediction.predictedDelay}` : prediction.predictedDelay} min delay
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className={`text-lg font-bold ${getConfidenceColor(prediction.confidence)}`}>
                {Math.round(prediction.confidence * 100)}%
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Contributing Factors</div>
            <div className="flex flex-wrap gap-1">
              {prediction.factors.map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rail-warning mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">AI Recommendation</div>
                <p className="text-sm">{prediction.recommendation}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {predictions.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No predictions available</p>
          <p className="text-sm text-muted-foreground mt-1">ML model will analyze incoming data</p>
        </div>
      )}
    </div>
  );
}