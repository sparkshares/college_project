import os
from llama_cpp import Llama
from django.conf import settings
import logging
import threading
import time

logger = logging.getLogger(__name__)

def simple_extractive_summary(text: str, max_length: int = 200) -> str:
    """Simple extractive summarizer as fallback"""
    import re
    
    # Clean up the text
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    if len(sentences) <= 2:
        return text[:max_length] + "..." if len(text) > max_length else text
    
    # Score sentences based on position and length
    scored_sentences = []
    for i, sentence in enumerate(sentences):
        score = 0
        # First sentence gets high score
        if i == 0:
            score += 3
        # Last sentence gets medium score
        elif i == len(sentences) - 1:
            score += 2
        # Middle sentences get lower scores
        else:
            score += 1
        
        # Prefer sentences with reasonable length
        if 20 <= len(sentence) <= 100:
            score += 2
        elif len(sentence) > 100:
            score += 1
        
        scored_sentences.append((score, sentence))
    
    # Sort by score and take top sentences
    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    
    # Select sentences to fit within max_length
    selected_sentences = []
    current_length = 0
    
    for score, sentence in scored_sentences:
        if current_length + len(sentence) + 2 <= max_length:  # +2 for ". "
            selected_sentences.append(sentence)
            current_length += len(sentence) + 2
        else:
            break
    
    if not selected_sentences:
        return text[:max_length] + "..." if len(text) > max_length else text
    
    # Sort selected sentences by their original order
    original_order = []
    for selected in selected_sentences:
        for i, original in enumerate(sentences):
            if selected == original:
                original_order.append((i, selected))
                break
    
    original_order.sort(key=lambda x: x[0])
    summary = '. '.join([sent for _, sent in original_order]) + '.'
    
    return summary[:max_length] + "..." if len(summary) > max_length else summary

class MistralSummarizer:
    def __init__(self):
        self.model = None
        # Try TinyLlama Q2_K first (much lighter), fallback to Mistral
        self.tinyllama_path = os.path.join(settings.BASE_DIR, 'models', 'tinyllama-1.1b-chat-v1.0.Q2_K.gguf')
        self.mistral_path = os.path.join(settings.BASE_DIR, 'models', 'mistral-7b-instruct-v0.1.Q2_K.gguf')
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the lightest available model"""
        # Try TinyLlama Q2_K first (much faster and lighter)
        if os.path.exists(self.tinyllama_path):
            model_path = self.tinyllama_path
            model_name = "TinyLlama Q2_K"
            # TinyLlama Q2_K optimized settings (very conservative for stability)
            model_params = {
                'n_ctx': 512,   # Smaller context for Q2_K quantization
                'n_threads': 1, # Single thread for stability
                'n_batch': 128, # Small batch size
                'verbose': False,
                'use_mlock': False,
                'n_gpu_layers': 0,  # CPU only
                'low_vram': True,
                'f16_kv': False,  # Use f32 for stability with Q2_K
                'use_mmap': True,
                'embedding': False,
                'numa': False,
                'seed': 42
            }
        elif os.path.exists(self.mistral_path):
            model_path = self.mistral_path
            model_name = "Mistral"
            # Mistral conservative settings (optimized for your Q2_K model)
            model_params = {
                'n_ctx': 2048,  # Increased context for better understanding
                'n_threads': 2,  # Use 2 threads for better performance
                'n_batch': 256,  # Reasonable batch size
                'verbose': False,
                'use_mlock': False,
                'n_gpu_layers': 0,  # CPU only for stability
                'low_vram': True,
                'f16_kv': True,
                'use_mmap': True,
                'embedding': False,
                'seed': 42  # Fixed seed for consistent results
            }
        else:
            logger.error(f"No model files found. Checked: {self.tinyllama_path}, {self.mistral_path}")
            raise FileNotFoundError("No model files found")
        
        try:
            logger.info(f"Loading {model_name} model from {model_path}")
            self.model = Llama(model_path=model_path, **model_params)
            logger.info(f"{model_name} model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading {model_name} model: {str(e)}")
            raise e
    
    def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a summary of the given text using Mistral model with timeout"""
        if not self.model:
            logger.warning("Model not initialized, using fallback summarizer")
            return simple_extractive_summary(text, max_length)
        
        # Truncate text aggressively for Q2_K quantization stability
        if len(text) > 300:  # Much smaller limit for Q2_K
            text = text[:300] + "..."
        
        # Simple prompt without complex instructions for TinyLlama Q2_K
        prompt = f"""Text: {text}

Summary:"""
        
        try:
            logger.info(f"Generating summary for text of length {len(text)}")
            
            # Use threading to implement timeout
            result = [None]
            exception = [None]
            
            def generate():
                try:
                    response = self.model(
                        prompt,
                        max_tokens=40,  # Very small token limit for stability
                        temperature=0.1,  # Very low temperature for consistency
                        top_p=0.5,
                        repeat_penalty=1.1,
                        stop=["\n", "Text:", "Summary:", "\n\n"],
                        echo=False,
                        stream=False
                    )
                    result[0] = response
                except Exception as e:
                    exception[0] = e
            
            # Start generation in a separate thread
            thread = threading.Thread(target=generate)
            thread.daemon = True
            thread.start()
            thread.join(timeout=15)  # Shorter timeout for Q2_K model
            
            if thread.is_alive():
                logger.warning("Model generation timed out, using fallback summarizer")
                return simple_extractive_summary(text, max_length)
            
            if exception[0]:
                raise exception[0]
            
            if result[0] is None:
                logger.warning("No result from model, using fallback summarizer")
                return simple_extractive_summary(text, max_length)
            
            # Extract and clean the generated text
            summary = result[0]['choices'][0]['text'].strip()
            
            # Clean up the summary - remove prompt artifacts
            summary = summary.replace("Summary:", "").strip()
            summary = summary.replace("Text:", "").strip()
            
            # Remove newlines and normalize whitespace
            summary = ' '.join(summary.split())
            
            # If the summary is too short, too long, or copying input, use fallback
            if len(summary) < 10 or len(summary) > max_length * 2:
                logger.warning("Generated summary length check failed, using fallback")
                return simple_extractive_summary(text, max_length)
            
            # Check if it's just copying the input
            if summary.lower().replace(' ', '').startswith(text[:30].lower().replace(' ', '')):
                logger.warning("Generated summary appears to be copying input, using fallback")
                return simple_extractive_summary(text, max_length)
            
            # Ensure proper sentence ending
            if summary and not summary.endswith(('.', '!', '?')):
                summary += '.'
            
            logger.info(f"TinyLlama summary generated: {len(summary)} characters")
            return summary if summary else simple_extractive_summary(text, max_length)
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}, using fallback")
            return simple_extractive_summary(text, max_length)

# Global instance
mistral_summarizer = None

def get_mistral_summarizer():
    """Get or create the global Mistral summarizer instance"""
    global mistral_summarizer
    if mistral_summarizer is None:
        try:
            mistral_summarizer = MistralSummarizer()
        except Exception as e:
            logger.error(f"Failed to initialize Mistral model: {str(e)}")
            # Return a fallback summarizer that only uses extractive summary
            class FallbackSummarizer:
                def generate_summary(self, text: str, max_length: int = 200) -> str:
                    return simple_extractive_summary(text, max_length)
            mistral_summarizer = FallbackSummarizer()
    return mistral_summarizer
