import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import QuizMode from './components/QuizMode';
import FlashcardViewer from './components/FlashcardViewer';
import { FiMenu } from 'react-icons/fi';

function App() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentMode, setCurrentMode] = useState('general');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  useEffect(() => {
    checkServerHealth();
    fetchDocuments();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setServerStatus('connected');
      }
    } catch (error) {
      setServerStatus('disconnected');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFilesUpload = async (files) => {
    setIsUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchDocuments();
        alert('Files uploaded successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      alert('Failed to upload files. Make sure the backend server is running.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearDocuments = async () => {
    if (window.confirm('Are you sure you want to clear all documents?')) {
      try {
        await fetch('http://localhost:8000/documents', {
          method: 'DELETE',
        });
        await fetchDocuments();
        alert('All documents cleared!');
      } catch (error) {
        alert('Failed to clear documents');
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FiMenu />
        </button>
        <h1>🎯 AI Placement Prep Assistant</h1>
        <div className={`status-indicator ${serverStatus}`}>
          {serverStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      <div className="app-container">
        {sidebarOpen && (
          <Sidebar
            documents={documents}
            onClearDocuments={handleClearDocuments}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
            selectedTopic={selectedTopic}
            onTopicChange={setSelectedTopic}
          />
        )}

        <main className="main-content">
          {documents.length === 0 ? (
            <FileUpload onFilesUpload={handleFilesUpload} isUploading={isUploading} />
          ) : currentMode === 'quiz' ? (
            <QuizMode 
              topic={selectedTopic} 
              onBack={() => setCurrentMode('general')}
            />
          ) : currentMode === 'flashcard' ? (
            <FlashcardViewer 
              topic={selectedTopic}
              onBack={() => setCurrentMode('general')}
            />
          ) : (
            <ChatInterface
              mode={currentMode}
              company={selectedCompany}
              topic={selectedTopic}
              onUploadMore={handleFilesUpload}
              isUploading={isUploading}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
