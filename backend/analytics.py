import numpy as np
from typing import Dict, List
from models import Train
from reinforcement_learning import rl_system
import logging

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    def __init__(self):
        self.sandbox_results = []
        
    def calculate_performance_metrics(self, trains: List[Train] = None) -> Dict:
        """Calculate comprehensive performance analytics"""
        
        # Get RL analytics
        rl_analytics = rl_system.get_analytics()
        
        # Calculate train punctuality
        if trains:
            on_time_trains = sum(1 for train in trains if train.status == "on-time")
            punctuality = (on_time_trains / len(trains)) * 100 if trains else 0
            
            # Calculate average delay
            total_delay = sum(train.delayMinutes for train in trains)
            avg_delay = total_delay / len(trains) if trains else 0
        else:
            punctuality = 85.0  # Default value
            avg_delay = 8.5
        
        # Calculate sandbox efficiency (average of recent results)
        sandbox_efficiency = 75.0  # Default
        if self.sandbox_results:
            recent_results = self.sandbox_results[-10:]  # Last 10 results
            sandbox_efficiency = np.mean([r.get("efficiency", 75) for r in recent_results])
        
        # Decision success rate
        decision_success_rate = rl_analytics["acceptanceRate"] * 100
        
        # Calculate delay reduction from accepted decisions
        avg_delay_reduction = 0
        if rl_analytics["acceptedDecisions"] > 0:
            # Estimate based on typical decision impact
            avg_delay_reduction = rl_analytics["acceptedDecisions"] * 12.5  # Average 12.5 min per decision
        
        return {
            "sandboxEfficiency": round(sandbox_efficiency, 1),
            "decisionSuccessRate": round(decision_success_rate, 1),
            "trainPunctuality": round(punctuality, 1),
            "totalDecisions": rl_analytics["totalDecisions"],
            "acceptedDecisions": rl_analytics["acceptedDecisions"],
            "rejectedDecisions": rl_analytics["rejectedDecisions"],
            "averageDelayReduction": round(avg_delay_reduction, 1),
            "topRejectionReasons": rl_analytics["topRejectionReasons"],
            "averageDelay": round(avg_delay, 1),
            "systemHealth": self._calculate_system_health(punctuality, decision_success_rate),
            "recommendations": self._generate_recommendations(
                punctuality, decision_success_rate, rl_analytics
            )
        }
    
    def _calculate_system_health(self, punctuality: float, decision_success_rate: float) -> str:
        """Calculate overall system health status"""
        health_score = (punctuality + decision_success_rate) / 2
        
        if health_score >= 85:
            return "excellent"
        elif health_score >= 70:
            return "good"
        elif health_score >= 55:
            return "fair"
        else:
            return "needs_attention"
    
    def _generate_recommendations(self, punctuality: float, 
                                decision_success_rate: float, 
                                rl_analytics: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if punctuality < 80:
            recommendations.append("Focus on delay reduction strategies")
        
        if decision_success_rate < 60:
            recommendations.append("Review AI decision parameters")
        
        if "safety" in rl_analytics["topRejectionReasons"]:
            safety_count = rl_analytics["topRejectionReasons"]["safety"]
            if safety_count > 3:
                recommendations.append("Strengthen safety constraints in AI model")
        
        if rl_analytics["totalDecisions"] < 10:
            recommendations.append("Increase AI decision frequency for better optimization")
        
        if not recommendations:
            recommendations.append("System performing well - maintain current operations")
        
        return recommendations
    
    def record_sandbox_result(self, result: Dict):
        """Record a sandbox simulation result"""
        self.sandbox_results.append(result)
        
        # Keep only last 50 results
        if len(self.sandbox_results) > 50:
            self.sandbox_results = self.sandbox_results[-50:]
    
    def evaluate_sandbox_scenario(self, trains: List[Train], 
                                 segments: List[Dict]) -> Dict:
        """Evaluate a sandbox scenario and return metrics"""
        
        # Calculate metrics
        total_delay = sum(train.delayMinutes for train in trains)
        affected_trains = sum(1 for train in trains if train.delayMinutes > 0)
        affected_passengers = sum(
            train.passengers or 0 for train in trains if train.delayMinutes > 0
        )
        
        # Estimate conflicts (simplified)
        conflicts_resolved = max(0, len(trains) - affected_trains - 2)
        
        # Calculate efficiency score
        max_possible_delay = len(trains) * 30  # Assume max 30 min delay per train
        efficiency = max(0, 100 - (total_delay / max_possible_delay * 100)) if max_possible_delay > 0 else 100
        
        # Generate recommendations
        recommendations = []
        if total_delay > 60:
            recommendations.append("Consider rerouting high-delay trains")
        if affected_passengers > 500:
            recommendations.append("Implement passenger notification system")
        if conflicts_resolved < 2:
            recommendations.append("Optimize scheduling to reduce conflicts")
        if efficiency < 70:
            recommendations.append("Review overall network capacity")
        
        result = {
            "totalDelay": total_delay,
            "affectedTrains": affected_trains,
            "affectedPassengers": affected_passengers,
            "conflictsResolved": conflicts_resolved,
            "efficiency": round(efficiency, 1),
            "recommendations": recommendations
        }
        
        # Record for analytics
        self.record_sandbox_result(result)
        
        return result

# Global analytics engine
analytics_engine = AnalyticsEngine()