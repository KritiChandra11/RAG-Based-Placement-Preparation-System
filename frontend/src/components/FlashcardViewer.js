import React, { useState } from 'react';
import './FlashcardViewer.css';
import { FiRefreshCw, FiArrowLeft, FiArrowRight, FiRotateCw } from 'react-icons/fi';

function FlashcardViewer({ topic, onBack }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardsStarted, setCardsStarted] = useState(false);
  const [numCards, setNumCards] = useState(10);

  const generateFlashcards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || null,
          num_cards: numCards
        })
      });

      const data = await response.json();
      setFlashcards(data.flashcards);
      setCardsStarted(true);
      setCurrentCard(0);
      setIsFlipped(false);
    } catch (error) {
      alert('Error generating flashcards. Make sure backend is running!');
    } finally {
      setIsLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const restart = () => {
    setCardsStarted(false);
    setFlashcards([]);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  if (!cardsStarted) {
    return (
      <div className="flashcard-setup">
        <h2>📇 Generate Flashcards</h2>
        <p>Create quick revision cards from your uploaded materials!</p>

        <div className="flashcard-settings">
          <div className="setting">
            <label>Topic:</label>
            <input
              type="text"
              value={topic || 'All Topics'}
              disabled
            />
          </div>

          <div className="setting">
            <label>Number of Cards:</label>
            <select value={numCards} onChange={(e) => setNumCards(parseInt(e.target.value))}>
              <option value="5">5 cards</option>
              <option value="10">10 cards</option>
              <option value="15">15 cards</option>
              <option value="20">20 cards</option>
            </select>
          </div>
        </div>

        <div className="setup-buttons">
          <button onClick={generateFlashcards} disabled={isLoading} className="generate-btn">
            {isLoading ? 'Generating...' : 'Generate Flashcards ✨'}
          </button>
          {onBack && <button onClick={onBack} className="back-btn">Back to Chat</button>}
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return <div className="loading">Loading flashcards...</div>;
  }

  return (
    <div className="flashcard-viewer">
      <div className="flashcard-header">
        <h2>📇 Flashcards - {topic || 'All Topics'}</h2>
        <div className="flashcard-counter">
          Card {currentCard + 1} of {flashcards.length}
        </div>
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={flipCard}>
          <div className="flashcard-front">
            <div className="card-label">Question</div>
            <div className="card-content">
              {flashcards[currentCard].front}
            </div>
            <div className="flip-hint">
              <FiRotateCw /> Click to flip
            </div>
          </div>
          <div className="flashcard-back">
            <div className="card-label">Answer</div>
            <div className="card-content">
              {flashcards[currentCard].back}
            </div>
            <div className="flip-hint">
              <FiRotateCw /> Click to flip
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button
          onClick={prevCard}
          disabled={currentCard === 0}
          className="nav-btn"
        >
          <FiArrowLeft /> Previous
        </button>

        <button onClick={flipCard} className="flip-btn">
          <FiRotateCw /> Flip Card
        </button>

        <button
          onClick={nextCard}
          disabled={currentCard === flashcards.length - 1}
          className="nav-btn"
        >
          Next <FiArrowRight />
        </button>
      </div>

      <div className="flashcard-progress">
        <div className="progress-dots">
          {flashcards.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === currentCard ? 'active' : ''} ${index < currentCard ? 'completed' : ''}`}
              onClick={() => {
                setCurrentCard(index);
                setIsFlipped(false);
              }}
            />
          ))}
        </div>
      </div>

      <div className="flashcard-actions">
        <button onClick={restart} className="restart-btn">
          <FiRefreshCw /> New Set
        </button>
        {onBack && <button onClick={onBack} className="back-btn">Back to Chat</button>}
      </div>
    </div>
  );
}

export default FlashcardViewer;
