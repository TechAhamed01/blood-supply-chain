# tests/test_response_system.py

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
import json

class TestResponseSystem(TestCase):
    """Test the standardized response system"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_success_response_structure(self):
        """Test success response structure"""
        response = self.client.get('/api/v1/health/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('code', response.data)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        self.assertIn('meta', response.data)
        
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['code'], 200)
        self.assertIn('timestamp', response.data['meta'])
        self.assertIn('api_version', response.data['meta'])
    
    def test_validation_error_response(self):
        """Test validation error response"""
        # Attempt to create hospital without required fields
        response = self.client.post('/api/v1/hospitals/', {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('errors', response.data)
        self.assertIsInstance(response.data['errors'], dict)
    
    def test_not_found_response(self):
        """Test 404 response"""
        response = self.client.get('/api/v1/hospitals/99999/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('errors', response.data)
    
    def test_unauthorized_response(self):
        """Test unauthorized response"""
        # Try to access protected endpoint without auth
        response = self.client.get('/api/v1/hospitals/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('errors', response.data)