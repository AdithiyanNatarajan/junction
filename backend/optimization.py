from ortools.sat.python import cp_model
from typing import List, Dict, Tuple
import numpy as np
from models import Train, RailwaySegment, OptimizedSchedule
import logging

logger = logging.getLogger(__name__)

class ScheduleOptimizer:
    def __init__(self):
        self.model = None
        self.solver = None
        
    def optimize_schedule(self, trains: List[Train], segments: List[RailwaySegment], 
                         time_horizon: int = 120) -> Dict:
        """
        Optimize train schedules using Constraint Programming
        """
        logger.info(f"Optimizing schedule for {len(trains)} trains over {time_horizon} minutes")
        
        # Create CP model
        model = cp_model.CpModel()
        
        # Time discretization (minutes)
        max_time = time_horizon
        
        # Variables for each train's departure time
        departure_times = {}
        arrival_times = {}
        
        for train in trains:
            # Parse scheduled time to minutes
            scheduled_minutes = self._time_to_minutes(train.scheduledTime)
            
            # Allow departure within ±30 minutes of scheduled time
            min_departure = max(0, scheduled_minutes - 30)
            max_departure = min(max_time, scheduled_minutes + 30)
            
            departure_times[train.id] = model.NewIntVar(
                min_departure, max_departure, f'departure_{train.id}'
            )
            
            # Estimate travel time (simplified)
            travel_time = self._estimate_travel_time(train)
            arrival_times[train.id] = model.NewIntVar(
                min_departure + travel_time, 
                max_departure + travel_time, 
                f'arrival_{train.id}'
            )
            
            # Constraint: arrival = departure + travel_time
            model.Add(arrival_times[train.id] == departure_times[train.id] + travel_time)
        
        # Conflict avoidance constraints
        self._add_conflict_constraints(model, trains, segments, departure_times, arrival_times)
        
        # Objective: minimize total delay
        total_delay = []
        for train in trains:
            scheduled_minutes = self._time_to_minutes(train.scheduledTime)
            delay = model.NewIntVar(0, max_time, f'delay_{train.id}')
            model.AddMaxEquality(delay, [
                departure_times[train.id] - scheduled_minutes, 0
            ])
            total_delay.append(delay)
        
        model.Minimize(sum(total_delay))
        
        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        
        status = solver.Solve(model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return self._extract_solution(solver, trains, departure_times, arrival_times)
        else:
            logger.warning("No feasible solution found, returning original schedule")
            return self._create_fallback_solution(trains)
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except:
            return 14 * 60 + 30  # Default to 14:30
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to HH:MM"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
    
    def _estimate_travel_time(self, train: Train) -> int:
        """Estimate travel time for a train (simplified)"""
        base_time = {
            'express': 45,
            'local': 60,
            'freight': 90
        }
        return base_time.get(train.type, 60)
    
    def _add_conflict_constraints(self, model, trains, segments, departure_times, arrival_times):
        """Add constraints to avoid conflicts between trains"""
        # Simplified: ensure minimum separation between trains on same route
        for i, train1 in enumerate(trains):
            for j, train2 in enumerate(trains[i+1:], i+1):
                if self._trains_share_route(train1, train2):
                    # Minimum 10-minute separation
                    separation = 10
                    
                    # Either train1 departs before train2 with separation
                    # or train2 departs before train1 with separation
                    b = model.NewBoolVar(f'order_{train1.id}_{train2.id}')
                    
                    model.Add(
                        departure_times[train2.id] >= departure_times[train1.id] + separation
                    ).OnlyEnforceIf(b)
                    
                    model.Add(
                        departure_times[train1.id] >= departure_times[train2.id] + separation
                    ).OnlyEnforceIf(b.Not())
    
    def _trains_share_route(self, train1: Train, train2: Train) -> bool:
        """Check if two trains share part of their route (simplified)"""
        # Simplified logic: trains share route if they have similar locations
        return (train1.currentLocation == train2.currentLocation or 
                train1.destination == train2.destination)
    
    def _extract_solution(self, solver, trains, departure_times, arrival_times):
        """Extract optimized solution from solver"""
        optimized_schedules = []
        total_delay_reduction = 0
        conflicts_resolved = 0
        
        for train in trains:
            original_minutes = self._time_to_minutes(train.scheduledTime)
            optimized_minutes = solver.Value(departure_times[train.id])
            
            delay_change = optimized_minutes - original_minutes
            if delay_change < 0:  # Improvement
                total_delay_reduction += abs(delay_change)
            
            optimized_schedules.append(OptimizedSchedule(
                trainId=train.id,
                originalSchedule=train.scheduledTime,
                optimizedSchedule=self._minutes_to_time(optimized_minutes),
                estimatedDelay=max(0, delay_change),
                routeChanges=[]  # Simplified
            ))
        
        # Calculate efficiency
        efficiency = min(100, max(0, 100 - (total_delay_reduction / len(trains))))
        
        return {
            "optimizedSchedules": optimized_schedules,
            "totalDelayReduction": total_delay_reduction,
            "conflictsResolved": conflicts_resolved,
            "efficiency": efficiency
        }
    
    def _create_fallback_solution(self, trains):
        """Create fallback solution when optimization fails"""
        return {
            "optimizedSchedules": [
                OptimizedSchedule(
                    trainId=train.id,
                    originalSchedule=train.scheduledTime,
                    optimizedSchedule=train.scheduledTime,
                    estimatedDelay=train.delayMinutes,
                    routeChanges=[]
                ) for train in trains
            ],
            "totalDelayReduction": 0,
            "conflictsResolved": 0,
            "efficiency": 50
        }

# Global optimizer instance
schedule_optimizer = ScheduleOptimizer()