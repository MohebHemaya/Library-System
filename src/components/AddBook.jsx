import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddBook = () => {
  const [newBook, setNewBook] = useState({
    title: '',
    authors: '',
    isbn: '',
    publisher: '',
    num_pages: ''
  });
  const navigate = useNavigate();

  // Handle adding a new book
  const handleAddBook = () => {
    axios
      .post('http://localhost:8000/books', newBook)
      .then(() => {
        navigate('/'); // Redirect to the home page after adding
      })
      .catch((error) => console.error('Error adding book:', error));
  };

  return (
    <>
      <h1 className="text-center mb-4">Add New Book</h1>
      <div className="mb-3">
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Title"
          value={newBook.title}
          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Authors"
          value={newBook.authors}
          onChange={(e) => setNewBook({ ...newBook, authors: e.target.value })}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="ISBN"
          value={newBook.isbn}
          onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Publisher"
          value={newBook.publisher}
          onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Number of Pages"
          value={newBook.num_pages}
          onChange={(e) => setNewBook({ ...newBook, num_pages: e.target.value })}
        />
        <button className="btn btn-success" onClick={handleAddBook}>
          Add Book
        </button>
      </div>
    </>
  );
};

export default AddBook;