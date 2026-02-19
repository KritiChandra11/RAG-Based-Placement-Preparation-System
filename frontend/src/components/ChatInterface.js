import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import { FiSend, FiUpload } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

function ChatInterface({ mode, company, topic, onUploadMore, isUploading }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          type: 'ai',
          content: getModeWelcomeMessage(),
          sources: []
        }
      ]);
    }
  }, [mode]);

  const getModeWelcomeMessage = () => {
    switch (mode) {
      case 'mock_interview':
        return "🎤 **Mock Interview Mode**\n\nI'll ask you interview questions based on your uploaded materials. Try:\n- 'Ask me DSA questions'\n- 'Give me system design questions'\n- 'Ask behavioral questions'";
      case 'resume_review':
        return "📄 **Resume Review Mode**\n\nUpload your resume and I'll provide detailed feedback:\n- 'Review my resume'\n- 'Suggest improvements for my skills section'\n- 'How can I make my resume ATS-friendly?'";
      case 'company_specific':
        return `🏢 **Company-Specific Mode**${company ? ` - ${company}` : ''}\n\nI'll help you prepare for specific companies:\n- 'What does Amazon ask in interviews?'\n- 'TCS interview pattern'\n- 'Common questions asked at Google'`;
      default:
        return "👋 **Welcome to AI Placement Prep Assistant!**\n\nI'm here to help you prepare for placements using your uploaded study materials.\n\n**Try asking:**\n- 'Explain quicksort algorithm'\n- 'What are DBMS normalization forms?'\n- 'Give me OS process scheduling questions'\n- 'Common interview questions for Amazon'";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          mode: mode,
          company: company || null,
          topic: topic || null
        }),
      });

      const data = await response.json();

      const aiMessage = {
        type: 'ai',
        content: data.answer,
        sources: data.sources || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: '❌ Sorry, I encountered an error. Please make sure the backend server is running.',
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onUploadMore(files);
    }
  };

  const quickPrompts = [
    "Ask me DSA questions",
    "Explain DBMS normalization",
    "What are OS scheduling algorithms?",
    "Give me behavioral questions",
    "Review my resume",
    "Common interview questions"
  ];

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="mode-indicator">
          <span className="mode-badge">{mode.replace('_', ' ').toUpperCase()}</span>
          {company && <span className="company-badge">{company}</span>}
          {topic && <span className="topic-badge">{topic}</span>}
        </div>
        <button
          className="upload-more-btn"
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
        >
          <FiUpload /> Upload More
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
        />
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              
              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <h4>📚 Sources:</h4>
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="source-item">
                      <strong>{source.source}</strong> (Page {source.page})
                      <p>{source.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="quick-prompts">
          <p>Quick prompts:</p>
          <div className="prompt-buttons">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputValue(prompt)}
                className="prompt-btn"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me anything about your study materials..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="send-btn"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
