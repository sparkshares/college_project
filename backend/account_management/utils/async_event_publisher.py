import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor
import threading

logger = logging.getLogger(__name__)

class AsyncEventPublisher:
    """
    Asynchronous event publisher for high-performance microservice communication
    Uses asyncio and aiohttp for non-blocking event publishing
    """
    
    def __init__(self):
        self.go_backend_url = getattr(settings, 'GO_BACKEND_URL', 'http://127.0.0.1:3001')
        self.timeout = getattr(settings, 'EVENT_TIMEOUT', 10)
        self.retry_attempts = getattr(settings, 'EVENT_RETRY_ATTEMPTS', 3)
        self.executor = ThreadPoolExecutor(max_workers=5)
        
    def publish_event_async(self, event_type: str, data: Dict[str, Any], user_id: Optional[int] = None):
        """
        Publish an event asynchronously without blocking the main thread
        
        Args:
            event_type: Type of event
            data: Event payload data
            user_id: Optional user ID
        """
        def run_async():
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(self._async_publish_event(event_type, data, user_id))
                loop.close()
            except Exception as e:
                logger.error(f"Async event publishing failed: {str(e)}")
        
        # Run in background thread to avoid blocking Django
        self.executor.submit(run_async)
    
    async def _async_publish_event(self, event_type: str, data: Dict[str, Any], user_id: Optional[int] = None):
        """
        Internal async method to publish events
        """
        event_payload = {
            "event_type": event_type,
            "timestamp": self._get_current_timestamp(),
            "source": "django-backend",
            "user_id": user_id,
            "data": data
        }
        
        url = f"{self.go_backend_url}/api/events"
        headers = {
            'Content-Type': 'application/json',
            'X-Source': 'django-backend'
        }
        
        for attempt in range(self.retry_attempts):
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                    async with session.post(url, json=event_payload, headers=headers) as response:
                        if response.status in [200, 201, 202]:
                            logger.info(f"Async event sent successfully: {event_type}")
                            return True
                        else:
                            logger.warning(f"Async event failed with status {response.status}")
                            
            except asyncio.TimeoutError:
                logger.warning(f"Async event timeout (attempt {attempt + 1})")
            except Exception as e:
                logger.error(f"Async event error (attempt {attempt + 1}): {str(e)}")
        
        logger.error(f"Failed to send async event after {self.retry_attempts} attempts: {event_type}")
        return False
    
    def publish_user_registered_event_async(self, user_data: Dict[str, Any]):
        """Async version of user registration event"""
        event_data = {
            "username": user_data.get("username"),
            "email": user_data.get("email"),
            "user_id": user_data.get("user_id"),
            "registration_timestamp": user_data.get("registration_timestamp")
        }
        
        self.publish_event_async(
            event_type="user.registered",
            data=event_data,
            user_id=user_data.get("user_id")
        )
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'

# Create async publisher instance
async_event_publisher = AsyncEventPublisher()
