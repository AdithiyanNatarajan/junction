// Mock data for railway traffic control system

export interface Train {
  id: string;
  name: string;
  type: 'express' | 'freight' | 'local';
  status: 'on-time' | 'delayed' | 'critical' | 'maintenance';
  currentLocation: string;
  destination: string;
  scheduledTime: string;
  actualTime: string;
  delayMinutes: number;
  priority: number;
  position: [number, number]; // [lat, lng]
  speed: number; // km/h
  passengers?: number;
}

export interface RailwaySegment {
  id: string;
  name: string;
  start: [number, number];
  end: [number, number];
  status: 'clear' | 'occupied' | 'maintenance' | 'blocked';
  maxSpeed: number;
}

export interface Prediction {
  trainId: string;
  predictedDelay: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}

export interface Decision {
  id: string;
  type: 'priority' | 'routing' | 'scheduling';
  description: string;
  impact: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  estimatedTimeSaving: number;
}

export interface Alert {
  id: string;
  type: 'delay' | 'conflict' | 'safety' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  trainId?: string;
  location: string;
  timestamp: string;
}

// Mock data for Indian Railways
export const mockTrains: Train[] = [
  {
    id: '12951',
    name: 'Mumbai Rajdhani Express',
    type: 'express',
    status: 'on-time',
    currentLocation: 'New Delhi',
    destination: 'Mumbai Central',
    scheduledTime: '14:30',
    actualTime: '14:30',
    delayMinutes: 0,
    priority: 10,
    position: [28.6139, 77.2090], // New Delhi
    speed: 85.75,
    passengers: 342
  },
  {
    id: '16031',
    name: 'Andaman Express',
    type: 'express',
    status: 'delayed',
    currentLocation: 'Ghaziabad Junction',
    destination: 'Chennai Central',
    scheduledTime: '14:15',
    actualTime: '14:27',
    delayMinutes: 12,
    priority: 8,
    position: [28.6692, 77.4538], // Ghaziabad
    speed: 72.30,
    passengers: 284
  },
  {
    id: '14553',
    name: 'Himachal Express',
    type: 'local',
    status: 'critical',
    currentLocation: 'Kalka',
    destination: 'Joginder Nagar',
    scheduledTime: '14:20',
    actualTime: '14:45',
    delayMinutes: 25,
    priority: 7,
    position: [30.8397, 76.9327], // Kalka
    speed: 0.00,
    passengers: 156
  },
  {
    id: '22470',
    name: 'Bikaner Superfast',
    type: 'express',
    status: 'on-time',
    currentLocation: 'Rewari Junction',
    destination: 'Bikaner Junction',
    scheduledTime: '14:45',
    actualTime: '14:45',
    delayMinutes: 0,
    priority: 9,
    position: [28.1895, 76.6179], // Rewari
    speed: 95.50,
    passengers: 298
  },
  {
    id: '19019',
    name: 'Dehradun Express',
    type: 'express',
    status: 'delayed',
    currentLocation: 'Saharanpur',
    destination: 'Dehradun',
    scheduledTime: '15:00',
    actualTime: '15:08',
    delayMinutes: 8,
    priority: 6,
    position: [29.9680, 77.5552], // Saharanpur
    speed: 68.25,
    passengers: 201
  }
];

export const mockRailwaySegments: RailwaySegment[] = [
  {
    id: 'seg-1',
    name: 'Delhi-Ghaziabad Main Line',
    start: [28.6139, 77.2090], // New Delhi
    end: [28.6692, 77.4538], // Ghaziabad
    status: 'occupied',
    maxSpeed: 130
  },
  {
    id: 'seg-2',
    name: 'Delhi-Rewari Section',
    start: [28.6139, 77.2090], // New Delhi
    end: [28.1895, 76.6179], // Rewari
    status: 'clear',
    maxSpeed: 110
  },
  {
    id: 'seg-3',
    name: 'Kalka-Shimla Heritage Line',
    start: [30.8397, 76.9327], // Kalka
    end: [31.1048, 77.1734], // Shimla
    status: 'maintenance',
    maxSpeed: 25
  },
  {
    id: 'seg-4',
    name: 'Delhi-Saharanpur Route',
    start: [28.6139, 77.2090], // New Delhi
    end: [29.9680, 77.5552], // Saharanpur
    status: 'clear',
    maxSpeed: 100
  },
  {
    id: 'seg-5',
    name: 'Rewari-Bikaner Line',
    start: [28.1895, 76.6179], // Rewari
    end: [28.0229, 73.3119], // Bikaner
    status: 'occupied',
    maxSpeed: 110
  }
];

export const mockPredictions: Prediction[] = [
  {
    trainId: 'EXP-101',
    predictedDelay: 3,
    confidence: 0.92,
    factors: ['Weather conditions', 'Traffic density'],
    recommendation: 'Maintain current schedule'
  },
  {
    trainId: 'FRT-203',
    predictedDelay: 18,
    confidence: 0.87,
    factors: ['Signal delay', 'Track congestion', 'Priority conflicts'],
    recommendation: 'Reroute via Loop B to reduce delay to 8 minutes'
  },
  {
    trainId: 'LOC-78',
    predictedDelay: 35,
    confidence: 0.95,
    factors: ['Mechanical issue', 'Platform availability'],
    recommendation: 'Emergency maintenance required - hold at current position'
  }
];

export const mockDecisions: Decision[] = [
  {
    id: 'dec-1',
    type: 'priority',
    description: 'Allow Express 101 to pass Freight 203 at Junction A',
    impact: 'Saves 15 minutes for 342 passengers, delays freight by 5 minutes',
    confidence: 0.89,
    status: 'pending',
    estimatedTimeSaving: 15
  },
  {
    id: 'dec-2',
    type: 'routing',
    description: 'Reroute Local 78 via Platform 5 due to maintenance',
    impact: 'Avoids 25-minute delay, adds 3 minutes to journey',
    confidence: 0.94,
    status: 'accepted',
    estimatedTimeSaving: 22
  },
  {
    id: 'dec-3',
    type: 'scheduling',
    description: 'Hold Express 205 for 2 minutes to coordinate with Local 78',
    impact: 'Prevents platform conflict, optimizes passenger connections',
    confidence: 0.76,
    status: 'pending',
    estimatedTimeSaving: 8
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'delay',
    severity: 'medium',
    message: 'Train LOC-78 experiencing 25-minute delay due to mechanical issue',
    trainId: 'LOC-78',
    location: 'Platform 3',
    timestamp: '14:22'
  },
  {
    id: 'alert-2',
    type: 'conflict',
    severity: 'high',
    message: 'Potential platform conflict between Express 101 and Local 78 at 14:30',
    location: 'Central Station',
    timestamp: '14:25'
  },
  {
    id: 'alert-3',
    type: 'maintenance',
    severity: 'low',
    message: 'Scheduled track maintenance on Segment 3 completed ahead of schedule',
    location: 'Central-Platform 3',
    timestamp: '14:10'
  },
  {
    id: 'alert-4',
    type: 'safety',
    severity: 'critical',
    message: 'Emergency stop required for Train LOC-78 - mechanical inspection needed',
    trainId: 'LOC-78',
    location: 'Platform 3',
    timestamp: '14:23'
  }
];