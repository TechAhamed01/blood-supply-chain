# apps/ai_engine/services/demand_predictor.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from django.conf import settings
from apps.core.models import DemandHistory, BloodType

class DemandPredictor:
    """Service for predicting blood demand"""
    
    def __init__(self, model_type='linear'):
        self.model_type = model_type
        self.model = None
        self.le_blood_type = LabelEncoder()
        self.model_path = os.path.join(settings.BASE_DIR, 'apps/ai_engine/ml_models/saved/')
        
    def prepare_features(self, df):
        """Prepare features for model training"""
        # Extract date features
        df['date'] = pd.to_datetime(df['request_date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Encode blood type
        df['blood_type_encoded'] = self.le_blood_type.fit_transform(df['blood_type'])
        
        # Create lag features (previous day demand)
        df = df.sort_values(['hospital_id', 'blood_type_encoded', 'date'])
        df['prev_day_demand'] = df.groupby(['hospital_id', 'blood_type_encoded'])['units_requested'].shift(1)
        df['prev_week_demand'] = df.groupby(['hospital_id', 'blood_type_encoded'])['units_requested'].shift(7)
        
        # Rolling averages
        df['rolling_7d_avg'] = df.groupby(['hospital_id', 'blood_type_encoded'])['units_requested'].transform(
            lambda x: x.rolling(window=7, min_periods=1).mean()
        )
        
        return df.fillna(0)
    
    def train_model(self):
        """Train demand prediction model using historical data"""
        # Get historical demand data
        queryset = DemandHistory.objects.all().values(
            'hospital_id', 'blood_type', 'units_requested', 'request_date'
        )
        
        if not queryset:
            # Generate synthetic data for training
            df = self.generate_synthetic_data()
        else:
            df = pd.DataFrame(list(queryset))
        
        # Prepare features
        df = self.prepare_features(df)
        
        # Define features and target
        feature_columns = ['day_of_week', 'month', 'day', 'is_weekend', 
                          'blood_type_encoded', 'prev_day_demand', 
                          'prev_week_demand', 'rolling_7d_avg']
        
        X = df[feature_columns]
        y = df['units_requested']
        
        # Train model based on type
        if self.model_type == 'linear':
            self.model = LinearRegression()
        else:
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        self.model.fit(X, y)
        
        # Save model
        self.save_model()
        
        return {'success': True, 'model_type': self.model_type}
    
    def predict_demand(self, hospital_id, blood_type, days=7):
        """Predict demand for next n days"""
        if not self.model:
            self.load_model()
        
        predictions = []
        last_date = datetime.now().date()
        
        for i in range(1, days + 1):
            pred_date = last_date + timedelta(days=i)
            
            # Create feature vector for prediction
            features = {
                'day_of_week': pred_date.weekday(),
                'month': pred_date.month,
                'day': pred_date.day,
                'is_weekend': 1 if pred_date.weekday() in [5, 6] else 0,
                'blood_type_encoded': self.le_blood_type.transform([blood_type])[0],
                'prev_day_demand': self.get_historical_demand(hospital_id, blood_type, pred_date - timedelta(days=1)),
                'prev_week_demand': self.get_historical_demand(hospital_id, blood_type, pred_date - timedelta(days=7)),
                'rolling_7d_avg': self.get_rolling_avg(hospital_id, blood_type, pred_date)
            }
            
            # Convert to DataFrame
            feature_df = pd.DataFrame([features])
            
            # Predict
            predicted_units = max(0, int(self.model.predict(feature_df)[0]))
            
            predictions.append({
                'date': pred_date,
                'predicted_units': predicted_units,
                'blood_type': blood_type
            })
        
        return predictions
    
    def generate_synthetic_data(self):
        """Generate synthetic demand data for training"""
        np.random.seed(42)
        data = []
        
        hospitals = [1, 2, 3]  # Sample hospital IDs
        blood_types = [bt[0] for bt in BloodType.choices]
        
        start_date = datetime.now() - timedelta(days=180)
        
        for hospital_id in hospitals:
            for blood_type in blood_types:
                # Base demand pattern
                base_demand = np.random.randint(5, 20)
                
                for day in range(180):
                    current_date = start_date + timedelta(days=day)
                    
                    # Add seasonality
                    weekend_multiplier = 1.3 if current_date.weekday() in [5, 6] else 1.0
                    monthly_pattern = 1 + 0.1 * np.sin(2 * np.pi * current_date.month / 12)
                    
                    # Add randomness
                    noise = np.random.normal(0, 2)
                    
                    demand = int(base_demand * weekend_multiplier * monthly_pattern + noise)
                    demand = max(0, demand)
                    
                    data.append({
                        'hospital_id': hospital_id,
                        'blood_type': blood_type,
                        'units_requested': demand,
                        'request_date': current_date
                    })
        
        return pd.DataFrame(data)
    
    def get_historical_demand(self, hospital_id, blood_type, date):
        """Get historical demand for a specific date"""
        try:
            demand = DemandHistory.objects.filter(
                hospital_id=hospital_id,
                blood_type=blood_type,
                request_date__date=date
            ).aggregate(total=models.Sum('units_requested'))['total']
            return demand or 0
        except:
            return 0
    
    def get_rolling_avg(self, hospital_id, blood_type, date, days=7):
        """Calculate rolling average demand"""
        start_date = date - timedelta(days=days)
        demands = DemandHistory.objects.filter(
            hospital_id=hospital_id,
            blood_type=blood_type,
            request_date__date__gte=start_date,
            request_date__date__lt=date
        ).values_list('units_requested', flat=True)
        
        if demands:
            return sum(demands) / len(demands)
        return 0
    
    def save_model(self):
        """Save trained model to disk"""
        if not os.path.exists(self.model_path):
            os.makedirs(self.model_path)
        
        model_file = os.path.join(self.model_path, f'demand_predictor_{self.model_type}.pkl')
        le_file = os.path.join(self.model_path, 'label_encoder.pkl')
        
        joblib.dump(self.model, model_file)
        joblib.dump(self.le_blood_type, le_file)
    
    def load_model(self):
        """Load trained model from disk"""
        model_file = os.path.join(self.model_path, f'demand_predictor_{self.model_type}.pkl')
        le_file = os.path.join(self.model_path, 'label_encoder.pkl')
        
        if os.path.exists(model_file):
            self.model = joblib.load(model_file)
            self.le_blood_type = joblib.load(le_file)
            return True
        return False