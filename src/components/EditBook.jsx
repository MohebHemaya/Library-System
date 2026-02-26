import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://my-json-server.typicode.com/MohebHemaya/db';

const EditBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState({
    title: '',
    authors: '',
    isbn: '',
    publisher: '',
    num_pages: '',
    debtCost: 50,
    totalCopies: 1,
    availableCopies: 1,
    lent: false,
    category: 'Fiction'
  });
  
  const [originalBook, setOriginalBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Add useState for categories
  const [categories, setCategories] = useState([
    'Fiction', 'Self-Help', 'Science', 'Politics', 'Poetry', 
    'Psychology', 'Sociology', 'Travel', 'Other'
  ]);
  
  // Fetch the book data
  useEffect(() => {
    setIsLoading(true);
    setValidationError('');
    setSaveSuccess(false);
    
    axios.get(`${API_URL}/books/${id}`)
      .then(response => {
        // Ensure all properties have default values if missing
        const bookData = {
          ...response.data,
          debtCost: response.data.debtCost || 50,
          totalCopies: response.data.totalCopies || 1,
          availableCopies: response.data.availableCopies !== undefined 
            ? response.data.availableCopies 
            : (response.data.lent ? 0 : 1),
          category: response.data.category || 'Fiction'
        };
        setBook(bookData);
        setOriginalBook(bookData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching book:', error);
        setIsLoading(false);
        setValidationError('Error loading book data. Book may not exist.');
      });
  }, [id]);
  
  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBook({ ...book, [name]: value });
    setValidationError('');
    setSaveSuccess(false);
  };
  
  // Handle debt cost change with validation
  const handleDebtCostChange = (e) => {
    let value = e.target.value;
    
    // Handle empty input
    if (value === '') {
      setBook({ ...book, debtCost: 50 });
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
    
    setBook({ ...book, debtCost: numericValue });
    setValidationError('');
    setSaveSuccess(false);
  };
  
  // Handle total copies change with validation
  const handleTotalCopiesChange = (e) => {
    let value = e.target.value;
    
    // Handle empty input
    if (value === '') {
      setBook({ ...book, totalCopies: 1 });
      return;
    }
    
    // Convert to number and validate
    let numericValue = parseInt(value);
    
    // Ensure it's a valid number
    if (isNaN(numericValue)) {
      return;
    }
    
    // Enforce minimum value (at least the number of copies currently lent out)
    const lentCopies = book.totalCopies - book.availableCopies;
    if (numericValue < lentCopies) {
      setValidationError(`Cannot reduce below ${lentCopies} copies as they are currently lent out.`);
      return;
    }
    
    // Update total copies and adjust available copies
    const availableCopies = book.availableCopies + (numericValue - book.totalCopies);
    
    setBook({ 
      ...book, 
      totalCopies: numericValue,
      availableCopies: availableCopies,
      lent: availableCopies === 0 // A book is lent when no copies are available
    });
    
    setValidationError('');
    setSaveSuccess(false);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!book.title || !book.authors) {
      setValidationError('Title and Authors are required fields.');
      return;
    }
    
    axios.put(`${API_URL}/books/${id}`, book)
      .then(() => {
        setSaveSuccess(true);
        setValidationError('');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      })
      .catch(error => {
        console.error('Error updating book:', error);
        setValidationError('Error saving book. Please try again.');
      });
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading book data...</p>
      </div>
    );
  }
  
  return (
    <div className="edit-book-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="section-title mb-0">Edit Book</h1>
        <Link to="/" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i> Back to Books
        </Link>
      </div>
      
      {validationError && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          {validationError}
        </div>
      )}
      
      {saveSuccess && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle me-2"></i>
          Book saved successfully! Redirecting...
        </div>
      )}
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="title" className="form-label">Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  name="title"
                  value={book.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="authors" className="form-label">Authors <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  id="authors"
                  name="authors"
                  value={book.authors}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="publisher" className="form-label">Publisher</label>
                <input
                  type="text"
                  className="form-control"
                  id="publisher"
                  name="publisher"
                  value={book.publisher}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="isbn" className="form-label">ISBN</label>
                <input
                  type="text"
                  className="form-control"
                  id="isbn"
                  name="isbn"
                  value={book.isbn}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="num_pages" className="form-label">Pages</label>
                <input
                  type="number"
                  className="form-control"
                  id="num_pages"
                  name="num_pages"
                  value={book.num_pages}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="debtCost" className="form-label">Debt Cost</label>
                <div className="input-group">
                  <span className="input-group-text">EGP</span>
                  <input
                    type="number"
                    className="form-control"
                    id="debtCost"
                    name="debtCost"
                    min="10"
                    value={book.debtCost}
                    onChange={handleDebtCostChange}
                  />
                </div>
                <div className="form-text">Debt cost per copy when lent</div>
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="totalCopies" className="form-label">Total Copies</label>
                <input
                  type="number"
                  className="form-control"
                  id="totalCopies"
                  name="totalCopies"
                  min={book.totalCopies - book.availableCopies}
                  value={book.totalCopies}
                  onChange={handleTotalCopiesChange}
                />
                <div className="form-text">
                  {book.totalCopies - book.availableCopies > 0 
                    ? `${book.totalCopies - book.availableCopies} copies currently lent out` 
                    : 'All copies available'}
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  className="form-select"
                  id="category"
                  name="category"
                  value={book.category || 'Fiction'}
                  onChange={handleChange}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Copy Status</label>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success">{book.availableCopies} Available</span>
                      <span className="badge bg-warning text-dark">{book.totalCopies - book.availableCopies} Lent</span>
                    </div>
                    <div className="progress" style={{ height: "10px" }}>
                      <div 
                        className={`progress-bar ${book.availableCopies === 0 ? 'bg-danger' : 'bg-success'}`}
                        role="progressbar" 
                        style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                        aria-valuenow={book.availableCopies} 
                        aria-valuemin="0" 
                        aria-valuemax={book.totalCopies}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12 mt-3">
                <div className="d-flex justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2" 
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times me-1"></i> Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    <i className="fas fa-save me-1"></i> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Book Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="mb-3">Current Status</h6>
                <div className="mb-2">
                  <span className="fw-bold me-2">Status:</span>
                  {book.availableCopies === 0 ? (
                    <span className="badge bg-warning text-dark">
                      <i className="fas fa-bookmark me-1"></i> All Copies Lent
                    </span>
                  ) : book.availableCopies < book.totalCopies ? (
                    <span className="badge bg-info text-dark">
                      <i className="fas fa-exchange-alt me-1"></i> Partially Available
                    </span>
                  ) : (
                    <span className="badge bg-success">
                      <i className="fas fa-check me-1"></i> All Copies Available
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2">Debt Cost:</span>
                  <span className="badge bg-secondary">
                    <i className="fas fa-pound-sign me-1"></i> {book.debtCost}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2">Total Value:</span>
                  <span>EGP {book.debtCost * book.totalCopies}</span>
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2">Category:</span>
                  <span className="badge bg-info text-dark">
                    {book.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
              <div className="col-md-6">
                <h6 className="mb-3">Inventory</h6>
                <div className="mb-2">
                  <span className="fw-bold me-2">Total Copies:</span>
                  <span>{book.totalCopies}</span>
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2">Available:</span>
                  <span>{book.availableCopies}</span>
                </div>
                <div className="mb-2">
                  <span className="fw-bold me-2">Lent Out:</span>
                  <span>{book.totalCopies - book.availableCopies}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBook;