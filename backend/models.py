from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TrainType(str, Enum):
    EXPRESS = "express"
    FREIGHT = "freight"
    LOCAL = "local"

class TrainStatus(str, Enum):
    ON_TIME = "on-time"
    DELAYED = "delayed"
    CRITICAL = "critical"
    MAINTENANCE = "maintenance"

class DecisionType(str, Enum):
    PRIORITY = "priority"
    ROUTING = "routing"
    SCHEDULING = "scheduling"

class DecisionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class RejectionReason(str, Enum):
    SAFETY = "safety"
    SPECIAL_SERVICE = "special_service"
    LOCAL_KNOWLEDGE = "local_knowledge"
    OTHER = "other"

class Train(BaseModel):
    id: str
    name: str
    type: TrainType
    status: TrainStatus
    currentLocation: str
    destination: str
    scheduledTime: str
    actualTime: str
    delayMinutes: int
    priority: int
    position: List[float]  # [lat, lng]
    speed: float
    passengers: Optional[int] = None

class RailwaySegment(BaseModel):
    id: str
    name: str
    start: List[float]  # [lat, lng]
    end: List[float]    # [lat, lng]
    status: str
    maxSpeed: int

class PredictionRequest(BaseModel):
    trainId: str
    currentLocation: str
    destination: str
    scheduledTime: str
    weatherConditions: Optional[str] = "clear"
    trafficDensity: Optional[float] = 0.5
    historicalDelays: Optional[List[float]] = []

class PredictionResponse(BaseModel):
    trainId: str
    predictedDelay: float
    confidence: float
    factors: List[str]
    recommendation: str

class OptimizationRequest(BaseModel):
    trains: List[Train]
    segments: List[RailwaySegment]
    timeHorizon: int = 120  # minutes
    objectives: List[str] = ["minimize_delays", "maximize_throughput"]

class OptimizedSchedule(BaseModel):
    trainId: str
    originalSchedule: str
    optimizedSchedule: str
    estimatedDelay: float
    routeChanges: List[str]

class OptimizationResponse(BaseModel):
    optimizedSchedules: List[OptimizedSchedule]
    totalDelayReduction: float
    conflictsResolved: int
    efficiency: float

class DecisionFeedback(BaseModel):
    decisionId: str
    action: str  # "accept" or "reject"
    reason: Optional[RejectionReason] = None
    timestamp: datetime
    controllerId: Optional[str] = None

class SandboxEvaluationRequest(BaseModel):
    scenario: str
    modifiedTrains: List[Train]
    modifiedSegments: List[RailwaySegment]

class SandboxEvaluationResponse(BaseModel):
    totalDelay: float
    affectedTrains: int
    affectedPassengers: int
    conflictsResolved: int
    efficiency: float
    recommendations: List[str]

class PerformanceAnalytics(BaseModel):
    sandboxEfficiency: float
    decisionSuccessRate: float
    trainPunctuality: float
    totalDecisions: int
    acceptedDecisions: int
    rejectedDecisions: int
    averageDelayReduction: float
    topRejectionReasons: Dict[str, int]