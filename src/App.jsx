/**
 * Main App Component
 * 
 * The root component of the application that sets up routing,
 * global state, and the overall layout.
 */

import React from 'react';
import { Routes, Route, Link, useLocation, NavLink, Navigate } from 'react-router-dom';
import BookList from './components/BookList';
import EditBook from './components/EditBook';
import MemberList from './components/MemberList';
import TransactionList from './components/TransactionList';
import './App.css';

const App = () => {
  const location = useLocation();
  
  return (
    <div className="main-container">
      <nav className="navbar navbar-expand-lg navbar-light bg-white mb-4 shadow-sm">
        <div className="container">
          <Link className="navbar-brand animate-fadeIn" to="/">
            <i className="fas fa-book-reader me-2 animate-pulse text-primary"></i>
            <span className="fw-bold d-none d-sm-inline">Library Management System</span>
            <span className="fw-bold d-sm-none">LMS</span>
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto animate-slideIn">
              <li className="nav-item mx-1">
                <NavLink 
                  className={({isActive}) => 
                    isActive ? "nav-link active position-relative px-3 py-2" : "nav-link position-relative px-3 py-2"
                  } 
                  to="/books"
                >
                  <i className="fas fa-book me-2"></i> <span className="d-inline">Books</span>
                  <span className="nav-highlight"></span>
                </NavLink>
              </li>
              <li className="nav-item mx-1">
                <NavLink 
                  className={({isActive}) => 
                    isActive ? "nav-link active position-relative px-3 py-2" : "nav-link position-relative px-3 py-2"
                  } 
                  to="/members"
                >
                  <i className="fas fa-users me-2"></i> <span className="d-inline">Members</span>
                  <span className="nav-highlight"></span>
                </NavLink>
              </li>
              <li className="nav-item mx-1">
                <NavLink 
                  className={({isActive}) => 
                    isActive ? "nav-link active position-relative px-3 py-2" : "nav-link position-relative px-3 py-2"
                  } 
                  to="/transactions"
                >
                  <i className="fas fa-exchange-alt me-2"></i> <span className="d-inline">Transactions</span>
                  <span className="nav-highlight"></span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="content-area container mb-5">
        <Routes>
          <Route path="/" element={<Navigate to="/books" />} />
          <Route path="/books" element={<div className="animate-fadeIn"><BookList /></div>} />
          <Route path="/members" element={<div className="animate-fadeIn"><MemberList /></div>} />
          <Route path="/transactions" element={<div className="animate-fadeIn"><TransactionList /></div>} />
          <Route path="/edit-book/:id" element={<div className="animate-fadeIn"><EditBook /></div>} />
        </Routes>
      </div>
      
      <footer className="bg-light text-center py-4 mt-5 border-top animate-fadeIn">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <h5 className="mb-3"><i className="fas fa-book-reader me-2 text-primary"></i> LMS</h5>
              <p className="text-muted small">A modern approach to library operations</p>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <h5 className="mb-3">Quick Links</h5>
              <div className="d-flex justify-content-center">
                <Link to="/books" className="text-decoration-none mx-2 text-secondary">Books</Link>
                <Link to="/members" className="text-decoration-none mx-2 text-secondary">Members</Link>
                <Link to="/transactions" className="text-decoration-none mx-2 text-secondary">Transactions</Link>
              </div>
            </div>
            <div className="col-md-4">
              <h5 className="mb-3">System Info</h5>
              <p className="text-muted small mb-0">Version 1.0.0</p>
              <p className="text-muted small">&copy; {new Date().getFullYear()} Library Management System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App; 