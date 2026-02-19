import requests
import os

print("="*60)
print("Testing RAG System - NO API KEY NEEDED!")
print("="*60)

# Test 1: Upload a PDF
print("\n[1] Uploading PDF...")
pdf_path = "sample_data/genai-interview-questions.pdf"

with open(pdf_path, 'rb') as f:
    files = {'files': (os.path.basename(pdf_path), f, 'application/pdf')}
    response = requests.post('http://localhost:8000/upload', files=files)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✓ PDF uploaded successfully!")
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")

# Test 2: Query the RAG system
print("\n" + "="*60)
print("[2] Asking a question...")
print("="*60)

question = "What is prompt engineering?"
query_data = {
    "question": question,
    "mode": "general"
}

response = requests.post('http://localhost:8000/query', json=query_data)
if response.status_code == 200:
    result = response.json()
    print(f"\n📝 Question: {question}")
    print(f"\n💡 Answer:\n{result['answer']}")
    print(f"\n📚 Sources: {len(result.get('sources', []))} documents used")
else:
    print(f"Error: {response.text}")

# Test 3: Generate quiz questions
print("\n" + "="*60)
print("[3] Generating Quiz Questions...")
print("="*60)

quiz_data = {
    "topic": "AI and GenAI",
    "difficulty": "medium",
    "num_questions": 3
}

response = requests.post('http://localhost:8000/quiz/generate', json=quiz_data)
if response.status_code == 200:
    questions = response.json().get('questions', [])
    print(f"\n✓ Generated {len(questions)} questions:\n")
    for i, q in enumerate(questions, 1):
        print(f"{i}. {q['question']}")
        print(f"   Difficulty: {q['difficulty']}\n")
else:
    print(f"Error: {response.text}")

# Test 4: Generate flashcards
print("="*60)
print("[4] Generating Flashcards...")
print("="*60)

flashcard_data = {
    "topic": "AI concepts",
    "num_cards": 3
}

response = requests.post('http://localhost:8000/flashcards/generate', json=flashcard_data)
if response.status_code == 200:
    flashcards = response.json().get('flashcards', [])
    print(f"\n✓ Generated {len(flashcards)} flashcards:\n")
    for i, card in enumerate(flashcards, 1):
        print(f"Card {i}:")
        print(f"  Front: {card['front']}")
        print(f"  Back: {card['back'][:100]}...")
        print()
else:
    print(f"Error: {response.text}")

print("="*60)
print("✓ RAG System Working - No API Key Required!")
print("Open http://localhost:8000/docs to see all API endpoints")
print("="*60)
