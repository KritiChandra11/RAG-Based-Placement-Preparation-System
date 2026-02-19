import React from 'react';
import './Sidebar.css';
import { FiTrash2, FiBook, FiMessageCircle, FiFileText, FiBriefcase } from 'react-icons/fi';

function Sidebar({
  documents,
  onClearDocuments,
  currentMode,
  onModeChange,
  selectedCompany,
  onCompanyChange,
  selectedTopic,
  onTopicChange
}) {
  const modes = [
    { id: 'general', label: 'General Chat', icon: <FiMessageCircle /> },
    { id: 'quiz', label: 'Take Quiz', icon: <FiMessageCircle /> },
    { id: 'flashcard', label: 'Flashcards', icon: <FiBook /> },
    { id: 'mock_interview', label: 'Mock Interview', icon: <FiMessageCircle /> },
    { id: 'resume_review', label: 'Resume Review', icon: <FiFileText /> },
    { id: 'company_specific', label: 'Company Prep', icon: <FiBriefcase /> },
  ];

  const companies = [
    'Amazon', 'Google', 'Microsoft', 'Meta', 'Apple',
    'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture',
    'Adobe', 'Oracle', 'Salesforce', 'Flipkart', 'PayTM'
  ];

  const topics = [
    'DSA', 'System Design', 'OS', 'DBMS', 'Computer Networks',
    'OOP', 'JavaScript', 'React', 'Python', 'Java',
    'SQL', 'Behavioral', 'HR Round', 'Aptitude'
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>
          <FiBook /> Documents ({documents.length})
        </h3>
        <div className="documents-list">
          {documents.length > 0 ? (
            documents.map((doc, index) => (
              <div key={index} className="document-item">
                📄 {doc}
              </div>
            ))
          ) : (
            <p className="no-documents">No documents uploaded</p>
          )}
        </div>
        {documents.length > 0 && (
          <button className="clear-btn" onClick={onClearDocuments}>
            <FiTrash2 /> Clear All
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Study Mode</h3>
        <div className="mode-buttons">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
              onClick={() => onModeChange(mode.id)}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>
      </div>

      {currentMode === 'company_specific' && (
        <div className="sidebar-section">
          <h3>Select Company</h3>
          <select
            value={selectedCompany}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="company-select"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sidebar-section">
        <h3>Focus Topic (Optional)</h3>
        <select
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          className="topic-select"
        >
          <option value="">All Topics</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-section tips-section">
        <h3>💡 Pro Tips</h3>
        <ul className="tips-list">
          <li>Upload more documents to get better answers</li>
          <li>Take quizzes to test your knowledge</li>
          <li>Use flashcards for quick revision</li>
          <li>Practice with mock interviews regularly</li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
