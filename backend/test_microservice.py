#!/usr/bin/env python3
"""
Test script for microservice event communication
"""
import requests
import json
import time

def test_registration_event():
    """Test user registration and event publishing"""
    print("🧪 Testing User Registration Event...")
    
    # Test data
    user_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "testpassword123"
    }
    
    try:
        # Register user
        response = requests.post(
            "http://localhost:8000/api/signup",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ User registration successful: {user_data['username']}")
            print(f"📤 Event should be sent to Go backend...")
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_login_event():
    """Test user login and event publishing"""
    print("\n🧪 Testing User Login Event...")
    
    # First register a user
    user_data = {
        "username": f"logintest_{int(time.time())}",
        "email": f"login_{int(time.time())}@example.com",
        "password": "testpassword123"
    }
    
    try:
        # Register user first
        reg_response = requests.post(
            "http://localhost:8000/api/signup",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if reg_response.status_code != 200:
            print(f"❌ Registration failed: {reg_response.text}")
            return
            
        # Now test login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        login_response = requests.post(
            "http://localhost:8000/api/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            print(f"✅ User login successful: {user_data['username']}")
            print(f"📤 Login event should be sent to Go backend...")
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_go_server():
    """Test if Go server is running"""
    print("\n🧪 Testing Go Backend Server...")
    
    try:
        response = requests.get("http://localhost:8080/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Go server is healthy: {data}")
        else:
            print(f"❌ Go server health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Go server. Make sure it's running on http://localhost:8080")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Microservice Event Communication Test")
    print("=" * 50)
    
    # Test Go server first
    test_go_server()
    
    # Test registration event
    test_registration_event()
    
    # Test login event
    test_login_event()
    
    print("\n" + "=" * 50)
    print("📋 Check the logs in:")
    print("  - Django console (user registration/login logs)")
    print("  - Go server console (event received logs)")
    print("  - Celery worker console (if using Celery)")
