import os
from typing import List, Dict, Optional
from pypdf import PdfReader
import faiss
import numpy as np
import pickle
import json
from sentence_transformers import SentenceTransformer
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class RAGPipeline:
    def __init__(self):
        self.model = None
        self.index = None
        self.documents = []
        self.index_path = "faiss_index.bin"
        self.docs_path = "documents.pkl"
        
        # Initialize embedding model
        print("Initializing embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✓ Embedding model loaded!")
        
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self.openai_client = OpenAI(api_key=api_key)
            print("✓ OpenAI client initialized!")
        else:
            print("⚠ No OpenAI API key found. Will use extractive QA.")
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence end
            if end < text_len:
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                if break_point > chunk_size * 0.7:
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text using sentence-transformers"""
        return self.model.encode(text, convert_to_numpy=True).astype('float32')
    
    def _get_completion(self, prompt: str, context: str, max_length: int = 500) -> str:
        """Generate answer using OpenAI or extractive approach"""
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant for placement preparation. Answer questions based on the provided context."},
                        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {prompt}\n\nProvide a clear and concise answer based on the context."}
                    ],
                    max_tokens=max_length,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API error: {e}. Falling back to extractive QA.")
        
        # Fallback: Simple extractive QA
        sentences = [s.strip() for s in context.split('.') if len(s.strip()) > 20]
        question_words = set(re.findall(r'\w+', prompt.lower()))
        scored_sentences = []
        
        for sent in sentences:
            sent_words = set(re.findall(r'\w+', sent.lower()))
            overlap = len(question_words & sent_words)
            if overlap > 0:
                scored_sentences.append((overlap, sent))
        
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        answer_sentences = [s[1] for s in scored_sentences[:5]]
        
        if answer_sentences:
            return '. '.join(answer_sentences) + '.'
        return "I couldn't find a specific answer in the uploaded materials. Please try rephrasing your question."
    
    def process_documents(self, file_paths: List[str]):
        """Process PDF documents and create search index"""
        new_docs = []
        
        # Load and chunk PDFs
        for file_path in file_paths:
            reader = PdfReader(file_path)
            filename = os.path.basename(file_path)
            
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                chunks = self._chunk_text(text)
                
                for chunk_idx, chunk in enumerate(chunks):
                    new_docs.append({
                        "content": chunk,
                        "source": filename,
                        "page": page_num + 1,
                        "chunk": chunk_idx
                    })
        
        # Add to existing documents or create new
        self.documents.extend(new_docs)
        
        # Create embeddings for all documents
        all_contents = [doc["content"] for doc in self.documents]
        embeddings = self.model.encode(all_contents, convert_to_numpy=True, show_progress_bar=True)
        embeddings = embeddings.astype('float32')
        
        # Create or update FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        
        print(f"✓ Indexed {len(self.documents)} document chunks")
        
        # Save to disk
        self._save_index()
    
    def _search(self, query: str, k: int = 4) -> List[Dict]:
        """Search for relevant documents using FAISS vector similarity"""
        if self.index is None or len(self.documents) == 0:
            return []
        
        # Get query embedding
        query_embedding = self._get_embedding(query)
        query_embedding = np.array([query_embedding])
        
        # Search FAISS index
        distances, indices = self.index.search(query_embedding, k)
        
        # Return relevant documents
        results = []
        for idx in indices[0]:
            if idx < len(self.documents):
                results.append(self.documents[idx])
        
        return results
    
    def query(self, question: str, mode: str = "general") -> Dict:
        """Query the RAG system"""
        if self.index is None:
            if not self._load_index():
                raise Exception("No vector store available. Please upload documents first.")
        
        # Get relevant documents
        relevant_docs = self._search(question, k=4)
        
        # Build context
        context = "\n\n".join([f"From {doc['source']} (page {doc['page']}):\n{doc['content']}" 
                               for doc in relevant_docs])
        
        # Generate answer using extractive approach
        answer = self._get_completion(question, context, max_length=500)
        
        # Format sources
        sources = []
        for doc in relevant_docs:
            sources.append({
                "content": doc["content"][:200] + "...",
                "source": doc["source"],
                "page": doc["page"]
            })
        
        return {
            "answer": answer,
            "sources": sources
        }
    
    def generate_quiz_questions(self, topic: Optional[str] = None, difficulty: str = "medium", num_questions: int = 5) -> List[Dict]:
        """Generate quiz questions from the knowledge base"""
        if self.index is None:
            if not self._load_index():
                raise Exception("No vector store available. Please upload documents first.")
        
        # Search for relevant content
        search_query = topic if topic else "interview questions concepts"
        relevant_docs = self._search(search_query, k=6)
        
        context = "\n\n".join([doc["content"] for doc in relevant_docs])
        
        topic_filter = f"on {topic}" if topic else "from the uploaded materials"
        difficulty_desc = {
            "easy": "basic, fundamental concepts",
            "medium": "intermediate level with some depth",
            "hard": "advanced, challenging with multiple concepts"
        }.get(difficulty, "medium difficulty")
        
        # Generate questions from context keywords and patterns
        questions = []
        lines = context.split('\n')
        
        # Look for question patterns in the content
        for line in lines:
            line = line.strip()
            if '?' in line and len(line) > 20 and len(line) < 200:
                questions.append({
                    "id": len(questions) + 1,
                    "question": line,
                    "difficulty": difficulty,
                    "topic": topic or "General"
                })
                if len(questions) >= num_questions:
                    break
        
        # If not enough questions found, generate from key sentences
        if len(questions) < num_questions:
            sentences = [s.strip() for s in context.split('.') if 20 < len(s.strip()) < 150]
            for sent in sentences[:num_questions - len(questions)]:
                # Convert statement to question
                q_text = f"Explain: {sent}?"
                questions.append({
                    "id": len(questions) + 1,
                    "question": q_text,
                    "difficulty": difficulty,
                    "topic": topic or "General"
                })
        
        return questions[:num_questions]
        
        # Parse questions
        questions = []
        lines = [line.strip() for line in questions_text.split('\n') if line.strip()]
        
        for line in lines:
            for j in range(1, 20):
                if line.startswith(f"{j}.") or line.startswith(f"{j})"):
                    question_text = line.split('.', 1)[1].strip() if '.' in line else line.split(')', 1)[1].strip()
                    questions.append({
                        "id": len(questions) + 1,
                        "question": question_text,
                        "difficulty": difficulty,
                        "topic": topic or "General"
                    })
                    break
        
        return questions[:num_questions]
    
    def check_answer(self, question: str, user_answer: str, topic: Optional[str] = None) -> Dict:
        """Check user's answer against the knowledge base"""
        if self.index is None:
            if not self._load_index():
                raise Exception("No vector store available. Please upload documents first.")
        
        # Get correct answer from knowledge base
        relevant_docs = self._search(question, k=3)
        context = "\n\n".join([doc["content"] for doc in relevant_docs])
        
        # Get expected answer
        correct_answer = self._get_completion(question, context, max_length=300)
        
        # Simple keyword-based evaluation
        user_words = set(re.findall(r'\w+', user_answer.lower()))
        correct_words = set(re.findall(r'\w+', correct_answer.lower()))
        
        # Calculate overlap
        overlap = len(user_words & correct_words)
        total_correct = len(correct_words)
        
        if total_correct > 0:
            score = min(100, int((overlap / total_correct) * 100))
        else:
            score = 50
        
        is_correct = score >= 70
        
        # Generate feedback
        if score >= 85:
            evaluation_text = f"Score: {score}/100\n\nExcellent answer! You covered the key concepts well.\n\nYour answer demonstrates good understanding of the topic."
        elif score >= 70:
            evaluation_text = f"Score: {score}/100\n\nGood answer! You got most of the important points.\n\nConsider adding more details about the concepts covered in the study material."
        elif score >= 50:
            evaluation_text = f"Score: {score}/100\n\nPartial credit. Your answer touches on some relevant points.\n\nReview the study material for more complete information. Key areas to focus on: the main concepts and definitions."
        else:
            evaluation_text = f"Score: {score}/100\n\nNeeds improvement. Your answer doesn't match the expected response well.\n\nPlease review the study material carefully and try to include the key terms and concepts."
        
        return {
            "is_correct": is_correct,
            "score": score,
            "feedback": evaluation_text,
            "correct_answer": correct_answer,
            "sources": relevant_docs[:2]
        }
    
    def generate_flashcards(self, topic: Optional[str] = None, num_cards: int = 10) -> List[Dict]:
        """Generate flashcards from the knowledge base"""
        if self.index is None:
            if not self._load_index():
                raise Exception("No vector store available. Please upload documents first.")
        
        # Search for relevant content
        search_query = topic if topic else "key concepts definitions"
        relevant_docs = self._search(search_query, k=8)
        
        context = "\n\n".join([doc["content"] for doc in relevant_docs])
        
        topic_filter = f"about {topic}" if topic else "from the uploaded materials"
        
        # Create flashcards from content
        flashcards = []
        sentences = [s.strip() for s in context.split('.') if 30 < len(s.strip()) < 200]
        
        # Look for definition patterns (is, are, means, etc.)
        for sent in sentences:
            if any(keyword in sent.lower() for keyword in [' is ', ' are ', ' means ', ' refers to ', 'definition']):
                parts = re.split(r' is | are | means | refers to ', sent, 1, re.IGNORECASE)
                if len(parts) == 2:
                    front = f"What is {parts[0].strip()}?"
                    back = parts[1].strip()
                    flashcards.append({
                        "id": len(flashcards) + 1,
                        "front": front,
                        "back": back,
                        "topic": topic or "General"
                    })
                    if len(flashcards) >= num_cards:
                        break
        
        # If not enough found, create from key sentences
        if len(flashcards) < num_cards:
            for i, sent in enumerate(sentences[len(flashcards):]):
                if len(flashcards) >= num_cards:
                    break
                # Split sentence into question and answer
                words = sent.split()
                if len(words) > 5:
                    mid = len(words) // 2
                    front = ' '.join(words[:mid]) + '...?'
                    back = sent
                    flashcards.append({
                        "id": len(flashcards) + 1,
                        "front": front,
                        "back": back,
                        "topic": topic or "General"
                    })
        
        return flashcards[:num_cards]
    
    def is_initialized(self) -> bool:
        """Check if document store is initialized"""
        return len(self.documents) > 0 or os.path.exists(self.docs_path)
    
    def get_vector_store_size(self) -> int:
        """Get number of documents in store"""
        return len(self.documents)
    
    def reset(self):
        """Reset the document store"""
        self.documents = []
        self.index = None
        if os.path.exists(self.docs_path):
            os.remove(self.docs_path)
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
    
    def _save_index(self):
        """Save documents and FAISS index to disk"""
        if self.documents:
            # Save documents
            with open(self.docs_path, 'wb') as f:
                pickle.dump(self.documents, f)
            
            # Save FAISS index
            if self.index is not None:
                faiss.write_index(self.index, self.index_path)
    
    def _load_index(self) -> bool:
        """Load documents and FAISS index from disk"""
        try:
            if os.path.exists(self.docs_path) and os.path.exists(self.index_path):
                # Load documents
                with open(self.docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
                
                # Load FAISS index
                self.index = faiss.read_index(self.index_path)
                
                print(f"✓ Loaded {len(self.documents)} documents from disk")
                return True
        except Exception as e:
            print(f"Error loading index: {e}")
        return False
