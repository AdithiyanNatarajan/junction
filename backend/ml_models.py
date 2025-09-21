import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class DelayPredictionModel:
    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        self.feature_names = [
            'hour', 'day_of_week', 'train_type_encoded', 'priority',
            'weather_encoded', 'traffic_density', 'historical_avg_delay',
            'distance_km', 'speed_kmh'
        ]
        
    def _generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data for the delay prediction model"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            # Time features
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Train features
            train_type = np.random.choice(['express', 'freight', 'local'])
            priority = np.random.randint(1, 11)
            
            # Environmental features
            weather = np.random.choice(['clear', 'rain', 'fog', 'snow'])
            traffic_density = np.random.uniform(0, 1)
            
            # Historical data
            historical_avg_delay = np.random.exponential(5)
            
            # Route features
            distance_km = np.random.uniform(10, 500)
            speed_kmh = np.random.uniform(40, 120)
            
            # Calculate delay based on realistic factors
            base_delay = 0
            
            # Time-based factors
            if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                base_delay += np.random.exponential(8)
            
            # Train type factors
            if train_type == 'freight':
                base_delay += np.random.exponential(12)
            elif train_type == 'local':
                base_delay += np.random.exponential(6)
            
            # Weather factors
            weather_multiplier = {
                'clear': 1.0, 'rain': 1.5, 'fog': 2.0, 'snow': 2.5
            }
            base_delay *= weather_multiplier[weather]
            
            # Traffic and historical factors
            base_delay += traffic_density * 10
            base_delay += historical_avg_delay * 0.3
            
            # Priority adjustment
            base_delay *= (11 - priority) / 10
            
            # Add some noise
            delay = max(0, base_delay + np.random.normal(0, 2))
            
            data.append({
                'hour': hour,
                'day_of_week': day_of_week,
                'train_type': train_type,
                'priority': priority,
                'weather': weather,
                'traffic_density': traffic_density,
                'historical_avg_delay': historical_avg_delay,
                'distance_km': distance_km,
                'speed_kmh': speed_kmh,
                'delay_minutes': delay
            })
        
        return pd.DataFrame(data)
    
    def _prepare_features(self, df):
        """Prepare features for training/prediction"""
        # Encode categorical variables
        for col in ['train_type', 'weather']:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col])
            else:
                df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col])
        
        # Select features
        X = df[self.feature_names].copy()
        return X
    
    def train(self):
        """Train the delay prediction model"""
        logger.info("Generating synthetic training data...")
        df = self._generate_synthetic_data()
        
        logger.info("Preparing features...")
        X = self._prepare_features(df)
        y = df['delay_minutes']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        logger.info("Training gradient boosting model...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Model trained - MAE: {mae:.2f}, R2: {r2:.3f}")
        self.is_trained = True
        
        return {"mae": mae, "r2": r2}
    
    def predict(self, train_data: Dict) -> Tuple[float, float, List[str]]:
        """Predict delay for a train"""
        if not self.is_trained:
            self.train()
        
        # Convert input to DataFrame
        df = pd.DataFrame([{
            'hour': int(train_data.get('scheduledTime', '14:30').split(':')[0]),
            'day_of_week': 1,  # Default to Monday
            'train_type': train_data.get('type', 'local'),
            'priority': train_data.get('priority', 5),
            'weather': train_data.get('weatherConditions', 'clear'),
            'traffic_density': train_data.get('trafficDensity', 0.5),
            'historical_avg_delay': np.mean(train_data.get('historicalDelays', [5])),
            'distance_km': 100,  # Default distance
            'speed_kmh': 80     # Default speed
        }])
        
        # Prepare features
        X = self._prepare_features(df)
        X_scaled = self.scaler.transform(X)
        
        # Predict
        delay_pred = self.model.predict(X_scaled)[0]
        
        # Calculate confidence (simplified)
        confidence = min(0.95, max(0.6, 1.0 - (delay_pred / 60)))
        
        # Generate factors
        factors = []
        if df['weather'].iloc[0] != 'clear':
            factors.append(f"Weather conditions: {df['weather'].iloc[0]}")
        if df['traffic_density'].iloc[0] > 0.7:
            factors.append("High traffic density")
        if df['historical_avg_delay'].iloc[0] > 10:
            factors.append("Historical delays in this route")
        if df['priority'].iloc[0] < 5:
            factors.append("Low priority train")
        
        if not factors:
            factors = ["Normal operating conditions"]
        
        return max(0, delay_pred), confidence, factors

# Global model instance
delay_model = DelayPredictionModel()