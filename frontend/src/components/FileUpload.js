import React, { useRef } from 'react';
import './FileUpload.css';
import { FiUpload, FiFile } from 'react-icons/fi';

function FileUpload({ onFilesUpload, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFilesUpload(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-card">
        <div className="upload-icon">
          <FiUpload />
        </div>
        <h2>Upload Your Study Materials</h2>
        <p className="upload-description">
          Upload PDFs containing DSA notes, interview experiences, company materials, 
          resumes, OS/DBMS/CN notes, or any placement preparation material.
        </p>

        <div
          className="drop-zone"
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <FiFile className="file-icon" />
          <p>Drag & drop PDF files here or click to browse</p>
          <span className="file-types">Supported: PDF files only</span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
        />

        {isUploading && (
          <div className="upload-progress">
            <div className="spinner"></div>
            <p>Processing your documents...</p>
          </div>
        )}

        <div className="upload-tips">
          <h3>💡 What you can upload:</h3>
          <ul>
            <li>📚 DSA (Data Structures & Algorithms) notes</li>
            <li>💻 OS, DBMS, Computer Networks notes</li>
            <li>🏢 Company interview experiences (Amazon, Google, TCS, Infosys, etc.)</li>
            <li>📄 Your resume for feedback</li>
            <li>📊 Aptitude and reasoning materials</li>
            <li>🎯 Previous year placement questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
