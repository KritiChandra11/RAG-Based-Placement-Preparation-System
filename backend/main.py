from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from pathlib import Path

from rag_pipeline import RAGPipeline

app = FastAPI(title="AI Placement Preparation Assistant")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag = RAGPipeline()

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class QueryRequest(BaseModel):
    question: str
    mode: Optional[str] = "general"  # general, mock_interview, resume_review, company_specific, quiz, flashcard
    company: Optional[str] = None
    topic: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    mode: str


class QuizRequest(BaseModel):
    topic: Optional[str] = None
    difficulty: Optional[str] = "medium"  # easy, medium, hard
    num_questions: Optional[int] = 5


class AnswerCheckRequest(BaseModel):
    question: str
    user_answer: str
    topic: Optional[str] = None


class AnswerCheckResponse(BaseModel):
    is_correct: bool
    score: int  # 0-100
    feedback: str
    correct_answer: str
    sources: List[dict]


class FlashcardRequest(BaseModel):
    topic: Optional[str] = None
    num_cards: Optional[int] = 10


@app.get("/")
def root():
    return {
        "message": "AI Placement Preparation Assistant API",
        "status": "running",
        "endpoints": ["/upload", "/query", "/documents", "/health"]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "documents_loaded": rag.is_initialized(),
        "vector_store_size": rag.get_vector_store_size()
    }


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload PDF files for RAG processing"""
    try:
        uploaded_files = []
        
        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"Only PDF files allowed. Got: {file.filename}")
            
            # Save file
            file_path = UPLOAD_DIR / file.filename
            content = await file.read()
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            uploaded_files.append(str(file_path))
        
        # Process all uploaded files through RAG pipeline
        rag.process_documents(uploaded_files)
        
        return {
            "message": f"Successfully uploaded and processed {len(uploaded_files)} files",
            "files": [f.filename for f in files],
            "total_documents": rag.get_vector_store_size()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """Query the RAG system"""
    try:
        if not rag.is_initialized():
            raise HTTPException(status_code=400, detail="No documents loaded. Please upload documents first.")
        
        # Get answer from RAG
        result = rag.query(request.question, mode=request.mode)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            mode=request.mode
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.get("/documents")
def list_documents():
    """List all uploaded documents"""
    documents = list(UPLOAD_DIR.glob("*.pdf"))
    return {
        "count": len(documents),
        "documents": [doc.name for doc in documents]
    }


@app.delete("/documents")
def clear_documents():
    """Clear all documents and reset vector store"""
    try:
        # Delete all files
        for doc in UPLOAD_DIR.glob("*.pdf"):
            doc.unlink()
        
        # Reset RAG pipeline
        rag.reset()
        
        return {"message": "All documents cleared successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing documents: {str(e)}")


@app.post("/quiz/generate")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions from uploaded materials"""
    try:
        if not rag.is_initialized():
            raise HTTPException(status_code=400, detail="No documents loaded. Please upload documents first.")
        
        questions = rag.generate_quiz_questions(
            topic=request.topic,
            difficulty=request.difficulty,
            num_questions=request.num_questions
        )
        
        return {
            "questions": questions,
            "topic": request.topic,
            "difficulty": request.difficulty
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


@app.post("/quiz/check", response_model=AnswerCheckResponse)
async def check_answer(request: AnswerCheckRequest):
    """Check user's answer against the knowledge base"""
    try:
        if not rag.is_initialized():
            raise HTTPException(status_code=400, detail="No documents loaded. Please upload documents first.")
        
        result = rag.check_answer(
            question=request.question,
            user_answer=request.user_answer,
            topic=request.topic
        )
        
        return AnswerCheckResponse(
            is_correct=result["is_correct"],
            score=result["score"],
            feedback=result["feedback"],
            correct_answer=result["correct_answer"],
            sources=result["sources"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking answer: {str(e)}")


@app.post("/flashcards/generate")
async def generate_flashcards(request: FlashcardRequest):
    """Generate flashcards from uploaded materials"""
    try:
        if not rag.is_initialized():
            raise HTTPException(status_code=400, detail="No documents loaded. Please upload documents first.")
        
        flashcards = rag.generate_flashcards(
            topic=request.topic,
            num_cards=request.num_cards
        )
        
        return {
            "flashcards": flashcards,
            "count": len(flashcards),
            "topic": request.topic
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
