import os
import chardet
from PyPDF2 import PdfReader
from docx import Document
import logging

logger = logging.getLogger(__name__)

class FileContentExtractor:
    """Extract text content from various file types"""
    
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        """Extract text content from a file based on its extension"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                return FileContentExtractor._extract_from_pdf(file_path)
            elif file_extension in ['.docx', '.doc']:
                return FileContentExtractor._extract_from_docx(file_path)
            elif file_extension in ['.txt', '.md', '.py', '.js', '.html', '.css', '.json']:
                return FileContentExtractor._extract_from_text_file(file_path)
            else:
                # Try to extract as text file with encoding detection
                return FileContentExtractor._extract_from_text_file(file_path)
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            raise Exception(f"Failed to extract text from file: {str(e)}")
    
    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading PDF file: {str(e)}")
    
    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading DOCX file: {str(e)}")
    
    @staticmethod
    def _extract_from_text_file(file_path: str) -> str:
        """Extract text from text-based files with encoding detection"""
        try:
            # Detect encoding
            with open(file_path, 'rb') as file:
                raw_data = file.read()
                encoding_result = chardet.detect(raw_data)
                encoding = encoding_result['encoding'] or 'utf-8'
            
            # Read file with detected encoding
            with open(file_path, 'r', encoding=encoding, errors='ignore') as file:
                return file.read().strip()
        except Exception as e:
            raise Exception(f"Error reading text file: {str(e)}")
    
    @staticmethod
    def is_supported_file(file_path: str) -> bool:
        """Check if the file type is supported for text extraction"""
        supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.py', '.js', '.html', '.css', '.json']
        file_extension = os.path.splitext(file_path)[1].lower()
        return file_extension in supported_extensions
