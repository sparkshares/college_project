#!/bin/bash

# Microservice Event System Setup Script
echo "🚀 Setting up Microservice Event-Driven Architecture"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the Django project root directory"
    exit 1
fi

echo "📋 Setup Options:"
echo "1. Basic HTTP Event Publishing (Simple, good for development)"
echo "2. Celery Queue-based Event Publishing (Production-ready)"
echo ""
read -p "Choose setup option (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Setting up Basic HTTP Event Publishing..."
        echo ""
        echo "📝 Instructions:"
        echo "1. Start Go backend server:"
        echo "   go run go_event_server_example.go"
        echo ""
        echo "2. Start Django server:"
        echo "   python manage.py runserver"
        echo ""
        echo "3. Test the setup:"
        echo "   python test_microservice.py"
        ;;
    2)
        echo "🔧 Setting up Celery Queue-based Event Publishing..."
        echo ""
        echo "📦 Installing Redis (if not already installed)..."
        if command -v brew &> /dev/null; then
            brew install redis 2>/dev/null || echo "Redis already installed"
            echo "🚀 Starting Redis..."
            brew services start redis
        else
            echo "⚠️  Please install Redis manually: https://redis.io/download"
        fi
        
        echo ""
        echo "📝 Instructions:"
        echo "1. Start Redis (if not already running):"
        echo "   brew services start redis"
        echo ""
        echo "2. Start Celery worker:"
        echo "   celery -A project_main worker --loglevel=info"
        echo ""
        echo "3. Start Go backend server:"
        echo "   go run go_event_server_example.go"
        echo ""
        echo "4. Start Django server:"
        echo "   python manage.py runserver"
        echo ""
        echo "5. Test the setup:"
        echo "   python test_microservice.py"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎯 Your microservice architecture is ready!"
echo ""
echo "📊 Event Flow:"
echo "  User Registration → Django API → Event Publisher → Go Backend Server"
echo ""
echo "🔍 Monitor logs in:"
echo "  - Django console: User registration/login events"
echo "  - Go server console: Received events"
if [ "$choice" = "2" ]; then
    echo "  - Celery worker console: Queue processing"
fi
echo ""
echo "📚 For more details, check: MICROSERVICE_SETUP.md"
