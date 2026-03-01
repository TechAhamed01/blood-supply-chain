from django.shortcuts import render

# Create your views here.
# apps/authentication/views.py

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.utils import timezone
import logging

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    UserSerializer, TokenResponseSerializer, LogoutSerializer
)
from .models import User

logger = logging.getLogger('authentication')

class RegisterView(APIView):
    """
    Register a new user (Hospital, BloodBank, or Admin)
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable authentication for this view
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }
            
            logger.info(f"New user registered: {user.email} with role {user.role}")
            
            return Response({
                'status': 'success',
                'message': 'User registered successfully',
                'data': response_data
            }, status=status.HTTP_201_CREATED)
        
        logger.warning(f"Registration failed: {serializer.errors}")
        return Response({
            'status': 'error',
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    Login user and return JWT tokens
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable authentication for this view
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }
            
            logger.info(f"User logged in: {user.email}")
            
            return Response({
                'status': 'success',
                'message': 'Login successful',
                'data': response_data
            }, status=status.HTTP_200_OK)
        
        logger.warning(f"Login failed: {serializer.errors}")
        return Response({
            'status': 'error',
            'message': 'Login failed',
            'errors': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    """
    Logout user by blacklisting refresh token
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                token = RefreshToken(serializer.validated_data['refresh'])
                token.blacklist()
                
                logger.info(f"User logged out: {request.user.email}")
                
                return Response({
                    'status': 'success',
                    'message': 'Logout successful'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Logout error: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': 'Invalid token'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'status': 'error',
            'message': 'Logout failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(APIView):
    """
    Refresh access token
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable authentication for this view
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'status': 'error',
                'message': 'Refresh token required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            return Response({
                'status': 'success',
                'data': {
                    'access': access_token
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return Response({
                'status': 'error',
                'message': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)

class MeView(APIView):
    """
    Get current authenticated user details
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        
        # Get role-specific profile if exists
        profile_data = {}
        if request.user.role == User.Role.HOSPITAL and hasattr(request.user, 'hospital_profile'):
            from apps.core.serializers import HospitalSerializer
            profile_data = HospitalSerializer(request.user.hospital_profile).data
        elif request.user.role == User.Role.BLOOD_BANK and hasattr(request.user, 'bloodbank_profile'):
            from apps.core.serializers import BloodBankSerializer
            profile_data = BloodBankSerializer(request.user.bloodbank_profile).data
        
        return Response({
            'status': 'success',
            'data': {
                'user': serializer.data,
                'profile': profile_data
            }
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update current user details"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"User updated: {request.user.email}")
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': 'Update failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)