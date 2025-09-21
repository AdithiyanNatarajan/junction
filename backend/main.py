# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from typing import Optional
import asyncio
import random
import json
from models import *
from ml_models import delay_model
from optimization import schedule_optimizer
from reinforcement_learning import rl_system
from analytics import analytics_engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS (so React frontend can call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Mock Data ----
ai_decisions_data = [
    {
        "id": "dec-1",
        "type": "priority",
        "description": "Allow Express 101 to pass Freight 203 at Junction A",
        "impact": "Saves 15 minutes for 342 passengers, delays freight by 5 minutes",
        "confidence": 0.89,
        "status": "pending",
        "estimatedTimeSaving": 15
    },
    {
        "id": "dec-2", 
        "type": "routing",
        "description": "Reroute Local 78 via Platform 5 due to maintenance",
        "impact": "Avoids 25-minute delay, adds 3 minutes to journey",
        "confidence": 0.94,
        "status": "accepted",
        "estimatedTimeSaving": 22
    },
    {
        "id": "dec-3",
        "type": "scheduling", 
        "description": "Hold Express 205 for 2 minutes to coordinate with Local 78",
        "impact": "Prevents platform conflict, optimizes passenger connections",
        "confidence": 0.76,
        "status": "pending",
        "estimatedTimeSaving": 8
    }
]

ml_predictions_data = [
    {
        "trainId": "EXP-101",
        "predictedDelay": 3,
        "confidence": 0.92,
        "factors": ["Weather conditions", "Traffic density"],
        "recommendation": "Maintain current schedule"
    },
    {
        "trainId": "FRT-203", 
        "predictedDelay": 18,
        "confidence": 0.87,
        "factors": ["Signal delay", "Track congestion", "Priority conflicts"],
        "recommendation": "Reroute via Loop B to reduce delay to 8 minutes"
    },
    {
        "trainId": "LOC-78",
        "predictedDelay": 35,
        "confidence": 0.95,
        "factors": ["Mechanical issue", "Platform availability"],
        "recommendation": "Emergency maintenance required - hold at current position"
    }
]


# ---- API Endpoints ----
@app.get("/")
def root():
    return {"message": "Railway AI Backend is running", "version": "2.0.0"}

@app.get("/aidecisions")
def get_ai_decisions():
    return {"decisions": ai_decisions_data}

@app.get("/mlpredictions")
def get_ml_predictions():
    return {"predictions": ml_predictions_data}

# Alternative endpoint for ML predictions (in case frontend uses different path)
@app.get("/predictions")
def get_predictions():
    return {"predictions": ml_predictions_data}

# ---- New ML & Optimization Endpoints ----

@app.post("/predict")
async def predict_delay(request: PredictionRequest):
    """Predict train delay using ML model"""
    try:
        train_data = {
            "trainId": request.trainId,
            "currentLocation": request.currentLocation,
            "destination": request.destination,
            "scheduledTime": request.scheduledTime,
            "weatherConditions": request.weatherConditions,
            "trafficDensity": request.trafficDensity,
            "historicalDelays": request.historicalDelays or []
        }
        
        delay, confidence, factors = delay_model.predict(train_data)
        
        # Generate recommendation based on prediction
        if delay < 5:
            recommendation = "Maintain current schedule"
        elif delay < 15:
            recommendation = "Monitor closely, minor adjustments may be needed"
        else:
            recommendation = "Consider rerouting or priority adjustment"
        
        return PredictionResponse(
            trainId=request.trainId,
            predictedDelay=round(delay, 1),
            confidence=round(confidence, 2),
            factors=factors,
            recommendation=recommendation
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize")
async def optimize_schedule(request: OptimizationRequest):
    """Optimize train schedules using constraint programming"""
    try:
        result = schedule_optimizer.optimize_schedule(
            request.trains, 
            request.segments, 
            request.timeHorizon
        )
        
        return OptimizationResponse(**result)
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- Reinforcement Learning Endpoints ----

@app.post("/decisions/{decision_id}/accept")
async def accept_decision(decision_id: str, controller_id: Optional[str] = None):
    """Accept an AI decision"""
    try:
        # Find the decision context (simplified)
        decision_context = None
        for decision in ai_decisions_data:
            if decision["id"] == decision_id:
                decision_context = decision
                break
        
        rl_system.record_decision(
            decision_id=decision_id,
            action="accept",
            controller_id=controller_id,
            decision_context=decision_context
        )
        
        # Update decision status
        for decision in ai_decisions_data:
            if decision["id"] == decision_id:
                decision["status"] = "accepted"
                break
        
        return {"status": "success", "message": "Decision accepted"}
    except Exception as e:
        logger.error(f"Accept decision error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decisions/{decision_id}/reject")
async def reject_decision(decision_id: str, reason: RejectionReason, 
                         controller_id: Optional[str] = None):
    """Reject an AI decision with reason"""
    try:
        # Find the decision context
        decision_context = None
        for decision in ai_decisions_data:
            if decision["id"] == decision_id:
                decision_context = decision
                break
        
        rl_system.record_decision(
            decision_id=decision_id,
            action="reject",
            reason=reason,
            controller_id=controller_id,
            decision_context=decision_context
        )
        
        # Update decision status
        for decision in ai_decisions_data:
            if decision["id"] == decision_id:
                decision["status"] = "rejected"
                break
        
        return {"status": "success", "message": f"Decision rejected: {reason.value}"}
    except Exception as e:
        logger.error(f"Reject decision error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/decisions/history")
async def get_decision_history(limit: Optional[int] = 50):
    """Get decision history for reinforcement learning"""
    try:
        history = rl_system.get_decision_history(limit)
        return {"history": history}
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- Sandbox & Analytics Endpoints ----

@app.post("/sandbox/evaluate")
async def evaluate_sandbox(request: SandboxEvaluationRequest):
    """Evaluate a sandbox scenario"""
    try:
        result = analytics_engine.evaluate_sandbox_scenario(
            request.modifiedTrains,
            [segment.dict() for segment in request.modifiedSegments]
        )
        
        return SandboxEvaluationResponse(**result)
    except Exception as e:
        logger.error(f"Sandbox evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/performance")
async def get_performance_analytics():
    """Get performance analytics and metrics"""
    try:
        # Convert mock trains to Train objects for analysis
        trains = [Train(**train) for train in mockTrains]
        metrics = analytics_engine.calculate_performance_metrics(trains)
        
        return PerformanceAnalytics(**metrics)
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- Area Selection Endpoint ----

@app.get("/trains/status")
async def get_trains_by_area(area: Optional[str] = None):
    """Get train status filtered by area/region"""
    try:
        trains = mockTrains.copy()
        
        if area:
            # Filter trains by area (simplified matching)
            area_lower = area.lower()
            filtered_trains = []
            
            for train in trains:
                if (area_lower in train["currentLocation"].lower() or 
                    area_lower in train["destination"].lower() or
                    area_lower in train["name"].lower()):
                    filtered_trains.append(train)
            
            trains = filtered_trains
        
        return {
            "trains": trains,
            "area": area,
            "count": len(trains)
        }
    except Exception as e:
        logger.error(f"Area filter error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- Mock Data (Updated) ----
mockTrains = [
    {
        "id": "12951",
        "name": "Mumbai Rajdhani Express",
        "type": "express",
        "status": "on-time",
        "currentLocation": "New Delhi",
        "destination": "Mumbai Central",
        "scheduledTime": "14:30",
        "actualTime": "14:30",
        "delayMinutes": 0,
        "priority": 10,
        "position": [28.6139, 77.2090],
        "speed": 85.75,
        "passengers": 342
    },
    {
        "id": "16031",
        "name": "Andaman Express",
        "type": "express",
        "status": "delayed",
        "currentLocation": "Ghaziabad Junction",
        "destination": "Chennai Central",
        "scheduledTime": "14:15",
        "actualTime": "14:27",
        "delayMinutes": 12,
        "priority": 8,
        "position": [28.6692, 77.4538],
        "speed": 72.30,
        "passengers": 284
    },
    {
        "id": "14553",
        "name": "Himachal Express",
        "type": "local",
        "status": "critical",
        "currentLocation": "Kalka",
        "destination": "Joginder Nagar",
        "scheduledTime": "14:20",
        "actualTime": "14:45",
        "delayMinutes": 25,
        "priority": 7,
        "position": [30.8397, 76.9327],
        "speed": 0.00,
        "passengers": 156
    }
]

# ---- WebSocket for Real-Time Train Updates ----
@app.websocket("/ws/trains")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate random train update
        update = {
            "train": random.choice(["Express 101", "Passenger 202", "Freight 303"]),
            "status": random.choice(["On Time", "Delayed", "Rerouted"]),
            "delay": random.randint(0, 15),
        }
        await websocket.send_json(update)
        await asyncio.sleep(3)  # send every 3 sec

# WebSocket for ML Predictions Updates
@app.websocket("/ws/predictions")
async def websocket_predictions(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate prediction updates
        train_ids = ["EXP-101", "FRT-203", "LOC-78"]
        train_id = random.choice(train_ids)
        
        update = {
            "trainId": train_id,
            "predictedDelay": random.randint(0, 30),
            "confidence": round(random.uniform(0.7, 0.98), 2),
            "factors": random.choice([
                ["Weather conditions", "Traffic density"],
                ["Signal delay", "Track congestion"],
                ["Mechanical issue", "Platform availability"]
            ]),
            "recommendation": random.choice([
                "Maintain current schedule",
                "Reroute via alternate track",
                "Emergency maintenance required"
            ])
        }
        await websocket.send_json(update)
        await asyncio.sleep(5)  # send every 5 sec

# WebSocket for AI Decisions Updates  
@app.websocket("/ws/decisions")
async def websocket_decisions(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Simulate new AI decisions
        decision_types = ["priority", "routing", "scheduling"]
        decision_type = random.choice(decision_types)
        
        update = {
            "id": f"dec-{random.randint(100, 999)}",
            "type": decision_type,
            "description": f"New {decision_type} decision for train optimization",
            "impact": f"Estimated time saving: {random.randint(5, 20)} minutes",
            "confidence": round(random.uniform(0.75, 0.95), 2),
            "status": "pending",
            "estimatedTimeSaving": random.randint(5, 20)
        }
        await websocket.send_json(update)
        await asyncio.sleep(8)  # send every 8 sec

# Initialize ML model on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing ML models...")
    try:
        # Train the delay prediction model
        delay_model.train()
        logger.info("ML models initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing ML models: {e}")
