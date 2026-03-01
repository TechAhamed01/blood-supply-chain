from django.shortcuts import render

# Create your views here.
# apps/ai_engine/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
import logging

from apps.core.permissions import IsAdminUser
from .services.demand_predictor import DemandPredictor

logger = logging.getLogger('api')

class DemandPredictionViewSet(viewsets.ViewSet):
    """
    ViewSet for demand prediction operations
    """
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['train', 'retrain']:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        return super().get_permissions()
    
    @action(detail=False, methods=['post'], url_path='train')
    def train(self, request):
        """
        Train demand prediction model
        """
        model_type = request.data.get('model_type', 'linear')
        
        try:
            predictor = DemandPredictor(model_type=model_type)
            result = predictor.train_model()
            
            logger.info(f"Model trained: {model_type}")
            
            return Response({
                'status': 'success',
                'message': 'Model trained successfully',
                'data': result
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Training failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='predict')
    def predict(self, request):
        """
        Predict demand for hospital and blood type
        """
        hospital_id = request.data.get('hospital_id')
        blood_type = request.data.get('blood_type')
        days = int(request.data.get('days', 7))
        
        if not all([hospital_id, blood_type]):
            return Response({
                'status': 'error',
                'message': 'hospital_id and blood_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            predictor = DemandPredictor()
            
            # Try to load existing model
            if not predictor.load_model():
                return Response({
                    'status': 'error',
                    'message': 'Model not trained yet. Please train the model first.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            predictions = predictor.predict_demand(
                hospital_id=int(hospital_id),
                blood_type=blood_type,
                days=days
            )
            
            return Response({
                'status': 'success',
                'data': {
                    'hospital_id': hospital_id,
                    'blood_type': blood_type,
                    'predictions': [
                        {
                            'date': p['date'].isoformat(),
                            'predicted_units': p['predicted_units']
                        }
                        for p in predictions
                    ]
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Prediction failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='model-info')
    def model_info(self, request):
        """
        Get information about trained model
        """
        model_type = request.query_params.get('model_type', 'linear')
        
        predictor = DemandPredictor(model_type=model_type)
        if predictor.load_model():
            return Response({
                'status': 'success',
                'data': {
                    'model_type': model_type,
                    'is_trained': True,
                    'feature_importance': getattr(predictor.model, 'feature_importances_', None)
                }
            })
        else:
            return Response({
                'status': 'success',
                'data': {
                    'model_type': model_type,
                    'is_trained': False
                }
            })