#!/usr/bin/env python3
"""
Quick test script to verify RAG pipeline setup
Run this after installing dependencies to check if everything works
"""

def check_imports():
    """Check if all required packages can be imported"""
    print("Checking imports...")
    errors = []
    
    try:
        import fastapi
        print("✓ fastapi")
    except ImportError as e:
        errors.append("fastapi")
        print(f"✗ fastapi: {e}")
    
    try:
        import uvicorn
        print("✓ uvicorn")
    except ImportError as e:
        errors.append("uvicorn")
        print(f"✗ uvicorn: {e}")
    
    try:
        from pypdf import PdfReader
        print("✓ pypdf")
    except ImportError as e:
        errors.append("pypdf")
        print(f"✗ pypdf: {e}")
    
    try:
        import faiss
        print("✓ faiss")
    except ImportError as e:
        errors.append("faiss")
        print(f"✗ faiss: {e}")
    
    try:
        import numpy as np
        print("✓ numpy")
    except ImportError as e:
        errors.append("numpy")
        print(f"✗ numpy: {e}")
    
    try:
        from sentence_transformers import SentenceTransformer
        print("✓ sentence-transformers")
    except ImportError as e:
        errors.append("sentence-transformers")
        print(f"✗ sentence-transformers: {e}")
    
    try:
        from openai import OpenAI
        print("✓ openai")
    except ImportError as e:
        errors.append("openai")
        print(f"✗ openai: {e}")
    
    try:
        from dotenv import load_dotenv
        print("✓ python-dotenv")
    except ImportError as e:
        errors.append("python-dotenv")
        print(f"✗ python-dotenv: {e}")
    
    return errors

def check_rag_pipeline():
    """Try to initialize RAG pipeline"""
    print("\nTesting RAG Pipeline initialization...")
    try:
        from rag_pipeline import RAGPipeline
        rag = RAGPipeline()
        print("✓ RAG Pipeline initialized successfully!")
        print(f"  - Documents loaded: {rag.is_initialized()}")
        print(f"  - Vector store size: {rag.get_vector_store_size()}")
        return True
    except Exception as e:
        print(f"✗ RAG Pipeline initialization failed: {e}")
        return False

def main():
    print("=" * 50)
    print("RAG Application Setup Verification")
    print("=" * 50)
    print()
    
    # Check imports
    import_errors = check_imports()
    
    if import_errors:
        print(f"\n⚠️  Missing packages: {', '.join(import_errors)}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All packages imported successfully!")
    
    # Check RAG pipeline
    if check_rag_pipeline():
        print("\n" + "=" * 50)
        print("✅ RAG Pipeline is working correctly!")
        print("=" * 50)
        print("\nYou can now:")
        print("1. Run 'python main.py' to start the backend")
        print("2. Open http://localhost:8000 to see the API")
        print("3. Upload PDFs and start querying!")
        return True
    else:
        print("\n⚠️  RAG Pipeline initialization failed")
        print("Check the error message above")
        return False

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
