# scripts/train_models.py

#!/usr/bin/env python
"""
Model training script for Blood Supply Chain AI Engine
Run: python scripts/train_models.py

This script:
- Generates synthetic historical demand data
- Trains Linear Regression and Random Forest models
- Saves trained models for prediction API
"""

import os
import sys
import django
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from pathlib import Path

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

# Django settings
from django.conf import settings

# ML imports
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Configure logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelTrainer:
    """
    Train and save demand prediction models
    """
    
    def __init__(self):
        self.models_dir = Path(settings.BASE_DIR) / 'apps' / 'ai_engine' / 'ml_models' / 'saved'
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.linear_model = None
        self.rf_model = None
        self.label_encoder = LabelEncoder()
        self.feature_columns = [
            'day_of_week', 'month', 'day', 'is_weekend',
            'blood_type_encoded', 'prev_day_demand',
            'prev_week_demand', 'rolling_7d_avg'
        ]
        
    def generate_synthetic_data(self, num_days=730, num_hospitals=5):
        """
        Generate synthetic demand data for training
        Creates 2 years of data for multiple hospitals
        """
        logger.info(f"Generating synthetic data for {num_days} days, {num_hospitals} hospitals...")
        
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        data = []
        
        # Base demand patterns for different blood types
        base_demand = {
            'O+': 25, 'O-': 8, 'A+': 20, 'A-': 6,
            'B+': 12, 'B-': 4, 'AB+': 5, 'AB-': 2
        }
        
        start_date = datetime.now() - timedelta(days=num_days)
        
        for hospital_id in range(1, num_hospitals + 1):
            # Each hospital has slightly different base demand
            hospital_factor = np.random.uniform(0.8, 1.2)
            
            for blood_type in blood_types:
                base = base_demand[blood_type] * hospital_factor
                
                for day in range(num_days):
                    current_date = start_date + timedelta(days=day)
                    
                    # Seasonal patterns
                    month = current_date.month
                    day_of_week = current_date.weekday()
                    
                    # Winter months have higher demand (flu season)
                    seasonal_factor = 1.0
                    if month in [12, 1, 2]:  # Winter
                        seasonal_factor = np.random.uniform(1.1, 1.3)
                    elif month in [6, 7, 8]:  # Summer
                        seasonal_factor = np.random.uniform(0.8, 0.9)
                    
                    # Weekend effect
                    weekend_factor = 1.2 if day_of_week in [5, 6] else 1.0
                    
                    # Holiday effect (simplified)
                    holiday_factor = 1.0
                    if (month == 12 and day in [24, 25, 26]) or (month == 1 and day == 1):
                        holiday_factor = 1.5
                    
                    # Random variation
                    noise = np.random.normal(0, base * 0.15)  # 15% standard deviation
                    
                    # Calculate demand
                    demand = base * seasonal_factor * weekend_factor * holiday_factor + noise
                    demand = max(0, int(round(demand)))
                    
                    # Add some random spikes for emergencies
                    if np.random.random() < 0.05:  # 5% chance of emergency
                        demand = int(demand * np.random.uniform(1.5, 2.5))
                    
                    data.append({
                        'hospital_id': hospital_id,
                        'blood_type': blood_type,
                        'units_requested': demand,
                        'request_date': current_date
                    })
        
        df = pd.DataFrame(data)
        logger.info(f"Generated {len(df)} records")
        return df
    
    def prepare_features(self, df):
        """
        Prepare features for model training
        """
        logger.info("Preparing features...")
        
        # Sort by hospital, blood type, and date
        df = df.sort_values(['hospital_id', 'blood_type', 'request_date'])
        
        # Extract date features
        df['date'] = pd.to_datetime(df['request_date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Encode blood type
        df['blood_type_encoded'] = self.label_encoder.fit_transform(df['blood_type'])
        
        # Create lag features per hospital and blood type
        df['prev_day_demand'] = df.groupby(['hospital_id', 'blood_type'])['units_requested'].shift(1)
        df['prev_week_demand'] = df.groupby(['hospital_id', 'blood_type'])['units_requested'].shift(7)
        
        # Rolling averages
        df['rolling_7d_avg'] = df.groupby(['hospital_id', 'blood_type'])['units_requested'].transform(
            lambda x: x.rolling(window=7, min_periods=1).mean()
        )
        
        # Drop rows with NaN values (first few days)
        df = df.dropna()
        
        logger.info(f"Feature shape: {df.shape}")
        return df
    
    def train_linear_regression(self, X_train, y_train, X_test, y_test):
        """
        Train Linear Regression model
        """
        logger.info("Training Linear Regression model...")
        
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Linear Regression - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.4f}")
        
        return model, {'mae': mae, 'rmse': rmse, 'r2': r2}
    
    def train_random_forest(self, X_train, y_train, X_test, y_test):
        """
        Train Random Forest model
        """
        logger.info("Training Random Forest model...")
        
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        # Feature importance
        feature_importance = dict(zip(self.feature_columns, model.feature_importances_))
        
        logger.info(f"Random Forest - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.4f}")
        logger.info("Feature Importance:")
        for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {feature}: {importance:.4f}")
        
        return model, {'mae': mae, 'rmse': rmse, 'r2': r2, 'feature_importance': feature_importance}
    
    def save_models(self, linear_model, rf_model, metrics):
        """
        Save trained models to disk
        """
        logger.info("Saving models...")
        
        # Save Linear Regression model
        linear_path = self.models_dir / 'linear_regression.pkl'
        joblib.dump(linear_model, linear_path)
        logger.info(f"Linear Regression model saved to {linear_path}")
        
        # Save Random Forest model
        rf_path = self.models_dir / 'random_forest.pkl'
        joblib.dump(rf_model, rf_path)
        logger.info(f"Random Forest model saved to {rf_path}")
        
        # Save label encoder
        encoder_path = self.models_dir / 'label_encoder.pkl'
        joblib.dump(self.label_encoder, encoder_path)
        logger.info(f"Label encoder saved to {encoder_path}")
        
        # Save metrics
        metrics_path = self.models_dir / 'metrics.json'
        import json
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        logger.info(f"Metrics saved to {metrics_path}")
        
        # Save feature columns
        features_path = self.models_dir / 'feature_columns.json'
        with open(features_path, 'w') as f:
            json.dump(self.feature_columns, f)
        logger.info(f"Feature columns saved to {features_path}")
    
    def run(self):
        """
        Execute model training pipeline
        """
        logger.info("="*50)
        logger.info("STARTING MODEL TRAINING")
        logger.info("="*50)
        
        # Generate synthetic data
        df = self.generate_synthetic_data(num_days=730, num_hospitals=5)
        
        # Prepare features
        df = self.prepare_features(df)
        
        # Split features and target
        X = df[self.feature_columns]
        y = df['units_requested']
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        logger.info(f"Training set size: {len(X_train)}")
        logger.info(f"Test set size: {len(X_test)}")
        
        # Train models
        linear_model, linear_metrics = self.train_linear_regression(X_train, y_train, X_test, y_test)
        rf_model, rf_metrics = self.train_random_forest(X_train, y_train, X_test, y_test)
        
        # Compile metrics
        metrics = {
            'linear_regression': linear_metrics,
            'random_forest': rf_metrics,
            'training_date': datetime.now().isoformat(),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features': self.feature_columns
        }
        
        # Save models
        self.save_models(linear_model, rf_model, metrics)
        
        logger.info("="*50)
        logger.info("MODEL TRAINING COMPLETED SUCCESSFULLY")
        logger.info("="*50)
        
        # Recommendation
        if rf_metrics['r2'] > linear_metrics['r2']:
            logger.info("Recommended model: Random Forest (better R2 score)")
        else:
            logger.info("Recommended model: Linear Regression (simpler, comparable performance)")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.run()