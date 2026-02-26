import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'https://my-json-server.typicode.com/MohebHemaya/db';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBook, setNewBook] = useState({
    title: '',
    authors: '',
    isbn: '',
    publisher: '',
    num_pages: '',
    debtCost: 50, // Default debt cost
    totalCopies: 1, // Default number of copies
    availableCopies: 1, // Default available copies (same as total initially)
    category: 'Fiction' // Default category
  });
  const [showAddBookForm, setShowAddBookForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookStats, setBookStats] = useState({
    total: 0,
    available: 0,
    lent: 0,
    totalDebtCost: 0,
    totalTitles: 0
  });
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  // Add selectedCategory state and categories array
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Fetch books from JSON Server
  const fetchBooks = () => {
    setIsLoading(true);
    axios
      .get(`${API_URL}/books`)
      .then((response) => {
        // Ensure all books have a debtCost property, default to 50 if not present
        // Also ensure they have totalCopies and availableCopies properties
        const booksWithDefaults = response.data.map(book => ({
          ...book,
          debtCost: book.debtCost || 50,
          totalCopies: book.totalCopies || 1,
          availableCopies: book.availableCopies !== undefined ? book.availableCopies : (book.lent ? 0 : 1),
          category: book.category || 'Uncategorized'
        }));
        
        // Extract unique categories
        const uniqueCategories = [...new Set(booksWithDefaults.map(book => book.category || 'Uncategorized'))].sort();
        setCategories(uniqueCategories);
        
        // Calculate book statistics
        const totalTitles = booksWithDefaults.length;
        const totalCopies = booksWithDefaults.reduce((sum, book) => sum + book.totalCopies, 0);
        const availableCopies = booksWithDefaults.reduce((sum, book) => sum + book.availableCopies, 0);
        const lentCopies = totalCopies - availableCopies;
        const totalDebtCost = booksWithDefaults.reduce((sum, book) => sum + book.debtCost * book.totalCopies, 0);
        
        setBookStats({
          total: totalCopies,
          available: availableCopies,
          lent: lentCopies,
          totalDebtCost,
          totalTitles
        });
        
        setBooks(booksWithDefaults);
        setFilteredBooks(booksWithDefaults);
        setTotalPages(Math.ceil(booksWithDefaults.length / itemsPerPage));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching books:', error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Update displayed books when filtered books or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedBooks(filteredBooks.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredBooks.length / itemsPerPage));
  }, [filteredBooks, currentPage, itemsPerPage]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
      setCurrentPage(1);
      return;
    }
    
    const filtered = books.filter(
      (book) =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.authors?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBooks(filtered);
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value === '') {
      setFilteredBooks(books);
    }
  };

  // Handle debt cost change
  const handleDebtCostChange = (e) => {
    let value = e.target.value;
    
    // Handle empty input
    if (value === '') {
      setNewBook({ ...newBook, debtCost: 50 });
      return;
    }
    
    // Convert to number and validate
    let numericValue = parseInt(value);
    
    // Ensure it's a valid number
    if (isNaN(numericValue)) {
      return;
    }
    
    // Enforce minimum value
    if (numericValue < 10) {
      numericValue = 10;
    }
    
    setNewBook({ ...newBook, debtCost: numericValue });
  };
  
  // Handle total copies change
  const handleTotalCopiesChange = (e) => {
    let value = e.target.value;
    
    // Handle empty input
    if (value === '') {
      setNewBook({ ...newBook, totalCopies: 1, availableCopies: 1 });
      return;
    }
    
    // Convert to number and validate
    let numericValue = parseInt(value);
    
    // Ensure it's a valid number
    if (isNaN(numericValue)) {
      return;
    }
    
    // Enforce minimum value
    if (numericValue < 1) {
      numericValue = 1;
    }
    
    setNewBook({ 
      ...newBook, 
      totalCopies: numericValue,
      availableCopies: numericValue // When adding a new book, all copies are available
    });
  };

  // Handle adding a new book
  const handleAddBook = () => {
    if (!newBook.title || !newBook.authors) {
      alert('Title and Authors are required fields');
      return;
    }
    
    const bookToAdd = {
      ...newBook,
      lent: false // A book is considered lent only when all copies are borrowed
    };
    
    axios
      .post(`${API_URL}/books`, bookToAdd)
      .then((response) => {
        // Update local state with the new book
        const updatedBooks = [...books, response.data];
        setBooks(updatedBooks);
        setFilteredBooks(updatedBooks);
        
        // Update book statistics
        setBookStats({
          total: bookStats.total + response.data.totalCopies,
          available: bookStats.available + response.data.availableCopies,
          lent: bookStats.lent,
          totalDebtCost: bookStats.totalDebtCost + (response.data.debtCost * response.data.totalCopies),
          totalTitles: bookStats.totalTitles + 1
        });
        
        // Reset the form
        setNewBook({ 
          title: '', 
          authors: '', 
          isbn: '', 
          publisher: '', 
          num_pages: '',
          debtCost: 50,
          totalCopies: 1,
          availableCopies: 1,
          category: 'Fiction'
        });
        setShowAddBookForm(false);
        
        // Go to the last page to see the new book
        setCurrentPage(Math.ceil((updatedBooks.length) / itemsPerPage));
      })
      .catch((error) => console.error('Error adding book:', error));
  };

  // Handle deleting a book
  const handleDeleteBook = (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      const bookToDelete = books.find(book => book.id === id);
      
      // Don't allow deletion if any copies are lent out
      if (bookToDelete.availableCopies < bookToDelete.totalCopies) {
        alert('Cannot delete this book because some copies are currently lent out.');
        return;
      }
      
      axios
        .delete(`${API_URL}/books/${id}`)
        .then(() => {
          const updatedBooks = books.filter((book) => book.id !== id);
          setBooks(updatedBooks);
          setFilteredBooks(updatedBooks);
          
          // Update book statistics
          setBookStats({
            total: bookStats.total - bookToDelete.totalCopies,
            available: bookStats.available - bookToDelete.availableCopies,
            lent: bookStats.lent - (bookToDelete.totalCopies - bookToDelete.availableCopies),
            totalDebtCost: bookStats.totalDebtCost - (bookToDelete.debtCost * bookToDelete.totalCopies),
            totalTitles: bookStats.totalTitles - 1
          });
          
          // Adjust current page if needed
          const newTotalPages = Math.ceil(updatedBooks.length / itemsPerPage);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          }
        })
        .catch((error) => console.error('Error deleting the book:', error));
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Filter by category function
  const filterByCategory = (category) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      setFilteredBooks(books);
    } else {
      setFilteredBooks(books.filter(book => book.category === category));
    }
    setCurrentPage(1);
  };

  return (
    <div className="book-list-container">
      <h1 className="section-title text-center mb-4">Book Management</h1>
      
      {/* Filter and Search Controls */}
      <div className="row mb-3">
        <div className="col-lg-8 col-md-12 mb-3 mb-lg-0">
          <div className="d-flex flex-column flex-md-row gap-2 mb-2">
            <div className="btn-group btn-group-sm flex-wrap">
              <button
                className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => filterByCategory('all')}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => filterByCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="mb-3 search-form-mobile">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <button type="submit" className="btn btn-primary d-none d-sm-inline-block">
                <i className="fas fa-search me-1"></i> Search
              </button>
              <button type="submit" className="btn btn-primary d-sm-none">
                <i className="fas fa-search"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-none d-sm-inline-block"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredBooks(books);
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times me-1"></i> Clear
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-sm-none"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredBooks(books);
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </form>
        </div>
        
        <div className="col-lg-4 col-md-12 text-md-end text-center">
          <div className="btn-group mb-2 w-100 w-md-auto">
            <button
              className={`btn ${showAddBookForm ? 'btn-danger' : 'btn-success'}`}
              onClick={() => setShowAddBookForm(!showAddBookForm)}
            >
              <i className={`fas ${showAddBookForm ? 'fa-minus' : 'fa-plus'} me-1`}></i>
              {showAddBookForm ? 'Hide Form' : 'Add New Book'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards Row */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-2 mb-4">
        <div className="col">
          <div className="card bg-light h-100">
            <div className="card-body text-center py-3">
              <h3 className="h5 mb-0">{bookStats.totalTitles}</h3>
              <p className="small mb-0">Book Titles</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-light h-100">
            <div className="card-body text-center py-3">
              <h3 className="h5 mb-0">{bookStats.total}</h3>
              <p className="small mb-0">Total Copies</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-light h-100">
            <div className="card-body text-center py-3">
              <h3 className="h5 mb-0">{bookStats.available}</h3>
              <p className="small mb-0">Available</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-light h-100">
            <div className="card-body text-center py-3">
              <h3 className="h5 mb-0">{bookStats.lent}</h3>
              <p className="small mb-0">Borrowed</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-light h-100">
            <div className="card-body text-center py-3">
              <h3 className="h5 mb-0">EGP {bookStats.totalDebtCost}</h3>
              <p className="small mb-0">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Book Form - Update with responsive classes */}
      {showAddBookForm && (
        <div className="card mb-4 animate-slideIn">
          <div className="card-header">
            <h5 className="mb-0">Add New Book</h5>
          </div>
          <div className="card-body">
            <div className="row row-tablet-adjust g-3">
              <div className="col-lg-6 col-md-6 col-sm-12">
                <label htmlFor="bookTitle" className="form-label">Book Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="bookTitle"
                  placeholder="Enter book title"
                  value={newBook.title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12">
                <label htmlFor="bookAuthors" className="form-label">Author(s) <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="bookAuthors"
                  placeholder="Author name(s)"
                  value={newBook.authors}
                  onChange={(e) =>
                    setNewBook({ ...newBook, authors: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            
            <div className="row row-tablet-adjust g-3 mt-1">
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookISBN" className="form-label">ISBN</label>
                <input
                  type="text"
                  className="form-control"
                  id="bookISBN"
                  placeholder="ISBN number"
                  value={newBook.isbn}
                  onChange={(e) =>
                    setNewBook({ ...newBook, isbn: e.target.value })
                  }
                />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookPublisher" className="form-label">Publisher</label>
                <input
                  type="text"
                  className="form-control"
                  id="bookPublisher"
                  placeholder="Publisher name"
                  value={newBook.publisher}
                  onChange={(e) =>
                    setNewBook({ ...newBook, publisher: e.target.value })
                  }
                />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookPages" className="form-label">Pages</label>
                <input
                  type="number"
                  className="form-control"
                  id="bookPages"
                  placeholder="Number of pages"
                  value={newBook.num_pages}
                  onChange={(e) =>
                    setNewBook({ ...newBook, num_pages: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div className="row row-tablet-adjust g-3 mt-1">
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookCategory" className="form-label">Category</label>
                <select
                  className="form-select"
                  id="bookCategory"
                  value={newBook.category}
                  onChange={(e) =>
                    setNewBook({ ...newBook, category: e.target.value })
                  }
                >
                  {['Fiction', 'Non-fiction', 'Science', 'Technology', 'History', 'Biography', 'Mystery', 'Fantasy', 'Other'].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookDebtCost" className="form-label">Debt Cost (EGP)</label>
                <div className="input-group">
                  <span className="input-group-text">EGP</span>
                  <input
                    type="number"
                    className="form-control"
                    id="bookDebtCost"
                    placeholder="50"
                    min="10"
                    value={newBook.debtCost}
                    onChange={handleDebtCostChange}
                  />
                </div>
              </div>
              <div className="col-lg-4 col-md-4 col-sm-6">
                <label htmlFor="bookCopies" className="form-label">Number of Copies</label>
                <input
                  type="number"
                  className="form-control"
                  id="bookCopies"
                  placeholder="1"
                  min="1"
                  value={newBook.totalCopies}
                  onChange={handleTotalCopiesChange}
                />
              </div>
            </div>
            
            <div className="d-flex flex-column flex-sm-row justify-content-end mt-3">
              <button
                type="button"
                className="btn btn-secondary mb-2 mb-sm-0 me-sm-2 w-100 w-sm-auto"
                onClick={() => {
                  setShowAddBookForm(false);
                  setNewBook({
                    title: '',
                    authors: '',
                    isbn: '',
                    publisher: '',
                    num_pages: '',
                    debtCost: 50,
                    totalCopies: 1,
                    availableCopies: 1,
                    category: 'Fiction'
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary w-100 w-sm-auto"
                onClick={handleAddBook}
                disabled={!newBook.title || !newBook.authors}
              >
                <i className="fas fa-save me-1"></i> Save Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Books List */}
      {isLoading ? (
        <div className="text-center py-5 animate-fadeIn">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading books...</span>
          </div>
          <p className="mt-2">Loading books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="alert alert-info animate-fadeIn">
          <i className="fas fa-info-circle me-2"></i>
          No books found. {searchTerm && (
            <span>Try a different search term or <button className="btn btn-link p-0" onClick={() => { setSearchTerm(''); setFilteredBooks(books); }}>clear the search</button>.</span>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive animate-fadeIn d-none d-md-block">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Copies</th>
                  <th>Debt Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedBooks.map((book) => (
                  <tr key={book.id} className={book.availableCopies === 0 ? "table-warning" : ""}>
                    <td>
                      <strong>{book.title}</strong>
                      {book.isbn && <div className="small text-muted">ISBN: {book.isbn}</div>}
                    </td>
                    <td>{book.authors}</td>
                    <td>
                      <span className="badge bg-info">{book.category || 'Uncategorized'}</span>
                    </td>
                    <td>
                      {book.availableCopies === 0 ? (
                        <span className="badge bg-warning text-dark">All Borrowed</span>
                      ) : (
                        <span className="badge bg-success">Available</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-primary">{book.availableCopies} / {book.totalCopies}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        <i className="fas fa-pound-sign me-1"></i> {book.debtCost}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/edit-book/${book.id}`}
                          className="btn btn-primary"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteBook(book.id)}
                          disabled={book.totalCopies !== book.availableCopies}
                          title={book.totalCopies !== book.availableCopies ? "Cannot delete book with borrowed copies" : "Delete book"}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="d-md-none animate-fadeIn">
            {displayedBooks.map((book) => (
              <div
                key={book.id}
                className={`card mb-3 card-3d-effect ${book.availableCopies === 0 ? "border-warning" : "border-light"}`}
              >
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{book.title}</h5>
                    <div className="small text-muted">{book.authors}</div>
                  </div>
                  <span className="badge bg-info">{book.category || 'Uncategorized'}</span>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      <small className="text-muted">Status:</small>
                      <div>
                        {book.availableCopies === 0 ? (
                          <span className="badge bg-warning text-dark">All Borrowed</span>
                        ) : (
                          <span className="badge bg-success">Available</span>
                        )}
                      </div>
                    </span>
                    <span>
                      <small className="text-muted">Copies:</small>
                      <div>
                        <span className="badge bg-primary">{book.availableCopies} / {book.totalCopies}</span>
                      </div>
                    </span>
                    <span>
                      <small className="text-muted">Debt Cost:</small>
                      <div>
                        <span className="badge bg-secondary">
                          <i className="fas fa-pound-sign me-1"></i> {book.debtCost}
                        </span>
                      </div>
                    </span>
                  </div>
                  {book.isbn && (
                    <div className="small text-muted mb-2">
                      ISBN: {book.isbn}
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="small text-muted">
                      {book.publisher && `${book.publisher}`}
                      {book.publisher && book.num_pages && ' | '}
                      {book.num_pages && `${book.num_pages} pages`}
                    </div>
                    <div className="btn-group">
                      <Link
                        to={`/edit-book/${book.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <i className="fas fa-edit me-1"></i> Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteBook(book.id)}
                        disabled={book.totalCopies !== book.availableCopies}
                      >
                        <i className="fas fa-trash-alt me-1"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination control - update to be responsive */}
          <div className="animate-fadeIn pagination-container" style={{animationDelay: "0.2s"}}>
            <div className="d-flex justify-content-between align-items-center flex-column flex-md-row mt-3">
              <div className="mb-3 mb-md-0 w-100 w-md-auto">
                <select
                  className="form-select form-select-sm"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{ width: 'auto', display: 'inline-block' }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <span className="ms-2 d-none d-sm-inline">
                  Showing {filteredBooks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length}
                </span>
              </div>
              
              <div className="d-flex justify-content-center w-100 w-md-auto">
                <button
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-angle-double-left"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-angle-left"></i>
                </button>
                
                <span className="mx-2 d-flex align-items-center">
                  <span className="d-none d-sm-inline">Page</span> {currentPage} <span className="d-none d-sm-inline">of</span> <span className="d-inline d-sm-none">/</span> {totalPages}
                </span>
                
                <button
                  className="btn btn-sm btn-outline-primary me-1"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-angle-right"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-angle-double-right"></i>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookList;