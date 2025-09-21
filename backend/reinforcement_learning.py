import json
import os
from datetime import datetime
from typing import List, Dict, Optional
from models import DecisionFeedback, RejectionReason
import logging

logger = logging.getLogger(__name__)

class RLFeedbackSystem:
    def __init__(self, history_file="decision_history.json"):
        self.history_file = history_file
        self.decision_history = self._load_history()
        
    def _load_history(self) -> List[Dict]:
        """Load decision history from file"""
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading history: {e}")
                return []
        return []
    
    def _save_history(self):
        """Save decision history to file"""
        try:
            with open(self.history_file, 'w') as f:
                json.dump(self.decision_history, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving history: {e}")
    
    def record_decision(self, decision_id: str, action: str, 
                       reason: Optional[RejectionReason] = None,
                       controller_id: Optional[str] = None,
                       decision_context: Optional[Dict] = None):
        """Record a decision feedback"""
        feedback = {
            "decisionId": decision_id,
            "action": action,
            "reason": reason.value if reason else None,
            "timestamp": datetime.now().isoformat(),
            "controllerId": controller_id,
            "context": decision_context or {}
        }
        
        self.decision_history.append(feedback)
        self._save_history()
        
        logger.info(f"Recorded decision: {decision_id} -> {action}")
        
        # Update learning signals
        self._update_learning_signals(feedback)
    
    def _update_learning_signals(self, feedback: Dict):
        """Update reinforcement learning signals based on feedback"""
        # This is where we would update our RL model
        # For now, we'll just log the learning signal
        
        decision_type = feedback.get("context", {}).get("type", "unknown")
        confidence = feedback.get("context", {}).get("confidence", 0.5)
        
        if feedback["action"] == "accept":
            # Positive reward - this type of decision was good
            reward = confidence * 1.0
            logger.info(f"Positive signal: {decision_type} decision with confidence {confidence}")
        else:
            # Negative reward - adjust based on rejection reason
            reason_weights = {
                "safety": -2.0,      # Strong negative signal
                "special_service": -0.5,  # Mild negative signal
                "local_knowledge": -1.0,  # Moderate negative signal
                "other": -0.8        # Default negative signal
            }
            
            reason = feedback.get("reason", "other")
            reward = reason_weights.get(reason, -0.8) * confidence
            logger.info(f"Negative signal: {decision_type} rejected for {reason}, reward: {reward}")
        
        # In a real implementation, this would update model weights
        # For now, we store the signal for future training
        feedback["learning_reward"] = reward
    
    def get_decision_history(self, limit: Optional[int] = None) -> List[Dict]:
        """Get decision history"""
        history = sorted(self.decision_history, 
                        key=lambda x: x["timestamp"], reverse=True)
        
        if limit:
            return history[:limit]
        return history
    
    def get_analytics(self) -> Dict:
        """Get analytics from decision history"""
        if not self.decision_history:
            return {
                "totalDecisions": 0,
                "acceptedDecisions": 0,
                "rejectedDecisions": 0,
                "acceptanceRate": 0.0,
                "topRejectionReasons": {},
                "averageConfidence": 0.0
            }
        
        total = len(self.decision_history)
        accepted = sum(1 for d in self.decision_history if d["action"] == "accept")
        rejected = total - accepted
        
        # Count rejection reasons
        rejection_reasons = {}
        confidences = []
        
        for decision in self.decision_history:
            if decision.get("reason"):
                reason = decision["reason"]
                rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1
            
            context = decision.get("context", {})
            if "confidence" in context:
                confidences.append(context["confidence"])
        
        return {
            "totalDecisions": total,
            "acceptedDecisions": accepted,
            "rejectedDecisions": rejected,
            "acceptanceRate": accepted / total if total > 0 else 0.0,
            "topRejectionReasons": rejection_reasons,
            "averageConfidence": sum(confidences) / len(confidences) if confidences else 0.0
        }
    
    def get_learning_insights(self) -> Dict:
        """Get insights for improving the AI model"""
        analytics = self.get_analytics()
        
        insights = []
        
        # Analyze rejection patterns
        if analytics["rejectedDecisions"] > 0:
            top_reasons = analytics["topRejectionReasons"]
            
            if "safety" in top_reasons and top_reasons["safety"] > 2:
                insights.append("High safety rejections - review safety constraints in model")
            
            if "local_knowledge" in top_reasons and top_reasons["local_knowledge"] > 3:
                insights.append("Local knowledge gaps - incorporate more regional data")
            
            if analytics["acceptanceRate"] < 0.6:
                insights.append("Low acceptance rate - model may be too aggressive")
        
        return {
            "insights": insights,
            "recommendedActions": [
                "Retrain model with recent feedback data",
                "Adjust confidence thresholds based on rejection patterns",
                "Incorporate domain-specific constraints"
            ]
        }

# Global RL system instance
rl_system = RLFeedbackSystem()