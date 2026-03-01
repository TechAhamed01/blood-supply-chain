#!/usr/bin/env python
"""
Test script to verify login endpoint
"""
import requests
import json

# Test login
url = "http://127.0.0.1:8000/api/v1/auth/login/"
payload = {
    "email": "admin@bloodchain.com",
    "password": "Admin@123"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        data = response.json()
        if 'data' in data and 'access' in data['data']:
            print("\n✓ Login successful! Token generated:")
            print(f"Access Token: {data['data']['access'][:50]}...")
            print(f"Refresh Token: {data['data']['refresh'][:50]}...")
        else:
            print("\n✗ Login failed - no tokens returned")
    else:
        print("\n✗ Login failed")
        
except requests.exceptions.ConnectionError:
    print("✗ Unable to connect to server at http://127.0.0.1:8000")
except Exception as e:
    print(f"✗ Error: {str(e)}")
