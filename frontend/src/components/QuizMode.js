import React, { useState, useEffect } from 'react';
import './QuizMode.css';
import { FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

function QuizMode({ topic, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || null,
          difficulty: difficulty,
          num_questions: numQuestions
        })
      });

      const data = await response.json();
      setQuestions(data.questions);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setScore(0);
      setAnsweredQuestions(0);
    } catch (error) {
      alert('Error generating quiz. Make sure backend is running!');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please enter your answer!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQuestion].question,
          user_answer: userAnswer,
          topic: topic || null
        })
      });

      const data = await response.json();
      setResult(data);
      setShowResult(true);
      setAnsweredQuestions(prev => prev + 1);
      if (data.is_correct) {
        setScore(prev => prev + data.score);
      }
    } catch (error) {
      alert('Error checking answer. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setResult(null);
    setUserAnswer('');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setUserAnswer('');
    setShowResult(false);
    setResult(null);
    setScore(0);
    setAnsweredQuestions(0);
  };

  if (!quizStarted) {
    return (
      <div className="quiz-setup">
        <h2>🎯 Start Your Quiz</h2>
        <p>Test your knowledge with questions from your uploaded materials!</p>

        <div className="quiz-settings">
          <div className="setting">
            <label>Topic:</label>
            <input
              type="text"
              value={topic || ''}
              placeholder="Leave empty for all topics"
              disabled
            />
          </div>

          <div className="setting">
            <label>Difficulty:</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="setting">
            <label>Number of Questions:</label>
            <select value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))}>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </div>
        </div>

        <div className="setup-buttons">
          <button onClick={generateQuiz} disabled={isLoading} className="start-btn">
            {isLoading ? 'Generating...' : 'Start Quiz 🚀'}
          </button>
          {onBack && <button onClick={onBack} className="back-btn">Back to Chat</button>}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="loading">Loading questions...</div>;
  }

  const isQuizComplete = answeredQuestions === questions.length;
  const averageScore = answeredQuestions > 0 ? Math.round(score / answeredQuestions) : 0;

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <div className="quiz-progress">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="quiz-score">
          Score: {averageScore}/100
        </div>
      </div>

      {!isQuizComplete ? (
        <div className="question-container">
          <div className="question-card">
            <div className="question-badge">{questions[currentQuestion].difficulty || 'Medium'}</div>
            <h3>Q{currentQuestion + 1}: {questions[currentQuestion].question}</h3>

            {!showResult ? (
              <div className="answer-section">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows="6"
                  disabled={isLoading}
                />
                <button onClick={submitAnswer} disabled={isLoading} className="submit-btn">
                  {isLoading ? 'Checking...' : 'Submit Answer'}
                </button>
              </div>
            ) : (
              <div className="result-section">
                <div className={`result-card ${result.is_correct ? 'correct' : 'incorrect'}`}>
                  <div className="result-header">
                    {result.is_correct ? (
                      <>
                        <FiCheckCircle className="result-icon" />
                        <h3>Great Job! ✨</h3>
                      </>
                    ) : (
                      <>
                        <FiXCircle className="result-icon" />
                        <h3>Keep Learning! 📚</h3>
                      </>
                    )}
                    <div className="result-score">Score: {result.score}/100</div>
                  </div>

                  <div className="your-answer">
                    <h4>Your Answer:</h4>
                    <p>{userAnswer}</p>
                  </div>

                  <div className="correct-answer">
                    <h4>Expected Answer:</h4>
                    <p>{result.correct_answer}</p>
                  </div>

                  <div className="feedback">
                    <h4>Feedback:</h4>
                    <p>{result.feedback}</p>
                  </div>

                  <button onClick={nextQuestion} className="next-btn">
                    {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="quiz-complete">
          <h2>🎉 Quiz Complete!</h2>
          <div className="final-score">
            <div className="score-circle">
              <span className="score-value">{averageScore}</span>
              <span className="score-label">/ 100</span>
            </div>
          </div>
          <p className="completion-message">
            You answered {answeredQuestions} questions
          </p>
          <div className="complete-actions">
            <button onClick={restartQuiz} className="restart-btn">
              <FiRefreshCw /> Try Again
            </button>
            {onBack && <button onClick={onBack} className="back-btn">Back to Chat</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizMode;
