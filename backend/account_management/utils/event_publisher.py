import requests
import json
import logging
from typing import Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

class EventPublisher:
    """
    Event publisher for microservice communication
    Supports HTTP-based event publishing to Go backend
    """
    
    def __init__(self):
        # Configure these in your settings.py
        self.go_backend_url = getattr(settings, 'GO_BACKEND_URL', 'http://127.0.0.1:3001')
        self.timeout = getattr(settings, 'EVENT_TIMEOUT', 10)
        self.retry_attempts = getattr(settings, 'EVENT_RETRY_ATTEMPTS', 3)
    
    def publish_event(self, event_type: str, data: Dict[str, Any], user_id: Optional[int] = None) -> bool:
        """
        Publish an event to the Go backend
        
        Args:
            event_type: Type of event (e.g., 'user.registered', 'user.login')
            data: Event payload data
            user_id: Optional user ID for tracking
            
        Returns:
            bool: True if event was published successfully, False otherwise
        """
        event_payload = {
            "event_type": event_type,
            "timestamp": self._get_current_timestamp(),
            "source": "django-backend",
            "user_id": user_id,
            "data": data
        }
        
        return self._send_event(event_payload)
    
    def publish_user_registered_event(self, user_data: Dict[str, Any]) -> bool:
        """
        Publish a user registration event
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            bool: Success status
        """
        event_data = {
            "username": user_data.get("username"),
            "email": user_data.get("email"),
            "user_id": user_data.get("user_id"),
            "registration_timestamp": user_data.get("registration_timestamp")
        }
        
        return self.publish_event(
            event_type="user.registered",
            data=event_data,
            user_id=user_data.get("user_id")
        )
    
    def publish_user_login_event(self, user_data: Dict[str, Any]) -> bool:
        """
        Publish a user login event
        
        Args:
            user_data: Dictionary containing user login information
            
        Returns:
            bool: Success status
        """
        event_data = {
            "username": user_data.get("username"),
            "email": user_data.get("email"),
            "user_id": user_data.get("user_id"),
            "login_timestamp": user_data.get("login_timestamp"),
            "ip_address": user_data.get("ip_address")
        }
        
        return self.publish_event(
            event_type="user.login",
            data=event_data,
            user_id=user_data.get("user_id")
        )
    
    def _send_event(self, event_payload: Dict[str, Any]) -> bool:
        """
        Send event to Go backend with retry logic
        
        Args:
            event_payload: Complete event payload
            
        Returns:
            bool: Success status
        """
        url = f"{self.go_backend_url}/api/events"
        headers = {
            'Content-Type': 'application/json',
            'X-Source': 'django-backend'
        }
        
        for attempt in range(self.retry_attempts):
            try:
                logger.info(f"Sending event (attempt {attempt + 1}): {event_payload['event_type']}")
                
                response = requests.post(
                    url,
                    json=event_payload,
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Event sent successfully: {event_payload['event_type']}")
                    return True
                else:
                    logger.warning(f"Event failed with status {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Network error sending event (attempt {attempt + 1}): {str(e)}")
                
            except Exception as e:
                logger.error(f"Unexpected error sending event (attempt {attempt + 1}): {str(e)}")
        
        logger.error(f"Failed to send event after {self.retry_attempts} attempts: {event_payload['event_type']}")
        return False
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'

# Create a singleton instance
event_publisher = EventPublisher()
