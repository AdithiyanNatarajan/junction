# backend/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import json

app = FastAPI()

# Enable CORS (so React frontend can call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for dev
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
    return {"message": "Backend is running"}

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
