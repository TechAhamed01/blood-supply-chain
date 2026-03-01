#!/usr/bin/env python
"""Test hospital login"""
import requests
import json

response = requests.post('http://127.0.0.1:8000/api/v1/auth/login/', 
                         json={'email': 'hospital1@example.com', 'password': 'Hospital@123'})

print(f'Status: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    print('✓ Hospital Login Successful!')
    print(f'User: {data["data"]["user"]["name"]}')
    print(f'Role: {data["data"]["user"]["role"]}')
    print(f'Access Token: {data["data"]["access"][:50]}...')
else:
    print('✗ Login Failed')
    print(json.dumps(response.json(), indent=2))
