import React, { useState, useEffect } from "react";
import axios from "axios";
import API_CONFIG from "../config/api";

const TransactionList = () => {
  // Define maximum debt limit as a constant for consistency
  const MAX_DEBT_LIMIT = 500;

  const [transactions, setTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [showLendForm, setShowLendForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookMap, setBookMap] = useState({});
  const [memberMap, setMemberMap] = useState({});
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [calculatedDebt, setCalculatedDebt] = useState({
    totalCost: 0,
    newTotalDebt: 0,
    booksAllowed: 0,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Add state variables for book filtering
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [filteredBooksForLending, setFilteredBooksForLending] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookCategories, setBookCategories] = useState([]);

  // Add state variables for member filtering
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [filteredMembersForLending, setFilteredMembersForLending] = useState(
    [],
  );

  // Fetch transactions, books, and members
  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      axios.get(API_CONFIG.getResourceUrl("books")),
      axios.get(API_CONFIG.getResourceUrl("members")),
      axios.get(API_CONFIG.getResourceUrl("transactions")),
    ])
      .then(([booksRes, membersRes, transactionsRes]) => {
        const bookData = booksRes.data;
        const memberData = membersRes.data;
        const transactionData = transactionsRes.data;

        // Create lookup maps for books and members for quick access
        const bookLookup = {};
        const memberLookup = {};

        // Ensure all books have a debtCost property, default to 50 if not present
        bookData.forEach((book) => {
          bookLookup[book.id] = {
            ...book,
            debtCost: book.debtCost || 50,
          };
        });

        memberData.forEach((member) => {
          memberLookup[member.id] = member;
        });

        // Extract unique book categories
        const uniqueCategories = [
          ...new Set(
            bookData
              .filter((book) => book.category)
              .map((book) => book.category),
          ),
        ];
        setBookCategories(["all", ...uniqueCategories.sort()]);

        setBooks(bookData);
        setMembers(memberData);
        setTransactions(transactionData);
        setFilteredTransactions(transactionData);
        setBookMap(bookLookup);
        setMemberMap(memberLookup);
        setTotalPages(Math.ceil(transactionData.length / itemsPerPage));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when filterStatus changes
  useEffect(() => {
    let filtered;
    if (filterStatus === "all") {
      filtered = transactions;
    } else if (filterStatus === "active") {
      filtered = transactions.filter((transaction) => !transaction.returned);
    } else if (filterStatus === "returned") {
      filtered = transactions.filter((transaction) => transaction.returned);
    } else {
      filtered = transactions;
    }

    // Sort to show active loans first
    const sortedFiltered = [...filtered].sort((a, b) => {
      // If a is not returned and b is returned, a comes first
      if (!a.returned && b.returned) return -1;
      // If a is returned and b is not returned, b comes first
      if (a.returned && !b.returned) return 1;
      // If both have the same returned status, sort by ID (newest first)
      return b.id - a.id;
    });

    setFilteredTransactions(sortedFiltered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [filterStatus, transactions, itemsPerPage]);

  // Update displayed transactions when filtered transactions or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Use the already sorted filteredTransactions
    setDisplayedTransactions(filteredTransactions.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredTransactions.length / itemsPerPage));
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Calculate debt and cost when selected member or books change
  useEffect(() => {
    if (selectedMember && memberMap[selectedMember]) {
      const member = memberMap[selectedMember];

      // Calculate total cost based on each book's debtCost
      const totalCost = selectedBooks.reduce((sum, bookId) => {
        const book = bookMap[bookId];
        return sum + (book ? book.debtCost : 50);
      }, 0);

      // Calculate how many more books can be borrowed
      const remainingCapacity = MAX_DEBT_LIMIT - member.debt;

      // Calculate average cost per book
      const avgBookCost =
        books.length > 0
          ? books.reduce((sum, book) => sum + (book.debtCost || 50), 0) /
            books.length
          : 50;

      const booksAllowed = Math.floor(remainingCapacity / avgBookCost);

      setCalculatedDebt({
        totalCost,
        newTotalDebt: member.debt + totalCost,
        booksAllowed,
      });
    }
  }, [
    selectedMember,
    selectedBooks,
    memberMap,
    bookMap,
    books,
    MAX_DEBT_LIMIT,
  ]);

  // Add useEffect to filter books for lending
  useEffect(() => {
    if (!books.length) return;

    let filtered = [...books];

    // Filter by search term
    if (bookSearchTerm.trim() !== "") {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
          book.authors.toLowerCase().includes(bookSearchTerm.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((book) => book.category === selectedCategory);
    }

    // Always filter out books with no available copies
    filtered = filtered.filter((book) => book.availableCopies > 0);

    // Sort by title
    filtered.sort((a, b) => a.title.localeCompare(b.title));

    setFilteredBooksForLending(filtered);
  }, [books, bookSearchTerm, selectedCategory]);

  // Add useEffect to filter members for lending
  useEffect(() => {
    if (!members.length) return;

    let filtered = [...members];

    // Filter by search term
    if (memberSearchTerm.trim() !== "") {
      filtered = filtered.filter((member) =>
        member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()),
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredMembersForLending(filtered);
  }, [members, memberSearchTerm]);

  // Handle lending books to a member
  const handleLendBooks = () => {
    if (selectedBooks.length === 0 || !selectedMember) {
      alert("Please select at least one book and a member.");
      return;
    }

    const member = members.find((m) => m.id === selectedMember);

    // Calculate total cost based on each book's debtCost
    const totalCost = selectedBooks.reduce((sum, bookId) => {
      const book = bookMap[bookId];
      return sum + (book ? book.debtCost : 50);
    }, 0);

    if (member.debt + totalCost > MAX_DEBT_LIMIT) {
      alert(
        `Member debt cannot exceed EGP ${MAX_DEBT_LIMIT}. Current debt: EGP ${member.debt}, New transaction cost: EGP ${totalCost}`,
      );
      return;
    }

    // Check if any selected book has no available copies
    const unavailableBooks = selectedBooks.filter((bookId) => {
      const book = books.find((b) => b.id === bookId);
      return book.availableCopies === 0;
    });

    if (unavailableBooks.length > 0) {
      alert("One or more selected books have no available copies.");
      return;
    }

    // Create transactions for each selected book
    const newTransactions = selectedBooks.map((bookId) => {
      const book = bookMap[bookId];
      return {
        bookID: bookId,
        memberID: selectedMember,
        date: new Date().toLocaleDateString(),
        returned: false,
        debtCost: book ? book.debtCost : 50, // Store the debt cost with the transaction
      };
    });

    // Update member's debt
    axios
      .patch(API_CONFIG.getResourceItemUrl("members", member.id), {
        debt: member.debt + totalCost,
      })
      .then(() => {
        // For each book, decrement available copies and set lent status if needed
        Promise.all(
          selectedBooks.map((bookId) => {
            const book = bookMap[bookId];
            const newAvailableCopies = book.availableCopies - 1;
            // A book is considered lent when all copies are borrowed
            const isLent = newAvailableCopies === 0;

            return axios.patch(API_CONFIG.getResourceItemUrl("books", bookId), {
              availableCopies: newAvailableCopies,
              lent: isLent,
            });
          }),
        )
          .then(() => {
            // Add transactions to the database
            Promise.all(
              newTransactions.map((transaction) =>
                axios.post(
                  API_CONFIG.getResourceUrl("transactions"),
                  transaction,
                ),
              ),
            )
              .then((responses) => {
                const newTransactionData = responses.map((res) => res.data);
                const updatedTransactions = [
                  ...transactions,
                  ...newTransactionData,
                ];
                setTransactions(updatedTransactions);

                // If filter status is "all" or "active", update filtered transactions
                if (filterStatus === "all" || filterStatus === "active") {
                  const updatedFiltered = [
                    ...filteredTransactions,
                    ...newTransactionData,
                  ];
                  setFilteredTransactions(updatedFiltered);
                  setTotalPages(
                    Math.ceil(updatedFiltered.length / itemsPerPage),
                  );
                  // Go to the last page to see the new transactions
                  setCurrentPage(
                    Math.ceil(updatedFiltered.length / itemsPerPage),
                  );
                }

                setSelectedBooks([]);
                setSelectedMember("");
                setShowLendForm(false); // Hide the form after lending
                fetchData(); // Refresh data
              })
              .catch((error) => console.error("Error lending books:", error));
          })
          .catch((error) => console.error("Error updating books:", error));
      })
      .catch((error) => console.error("Error updating member debt:", error));
  };

  // Handle returning a book
  const handleReturnBook = (transactionId) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const member = members.find((m) => m.id === transaction.memberID);
    const book = bookMap[transaction.bookID];

    // Get the debt cost from the transaction or the book, or default to 50
    const debtCost = transaction.debtCost || (book ? book.debtCost : 50);

    // Reduce member's debt by the book's debt cost
    axios
      .patch(API_CONFIG.getResourceItemUrl("members", member.id), {
        debt: Math.max(0, member.debt - debtCost), // Ensure debt doesn't go below 0
      })
      .then(() => {
        // Increment the book's available copies and update lent status
        const newAvailableCopies = (book.availableCopies || 0) + 1;
        axios
          .patch(API_CONFIG.getResourceItemUrl("books", transaction.bookID), {
            availableCopies: newAvailableCopies,
            lent: newAvailableCopies < book.totalCopies, // Book is considered lent if not all copies are available
          })
          .then(() => {
            // Mark the transaction as returned
            axios
              .patch(
                API_CONFIG.getResourceItemUrl("transactions", transactionId),
                {
                  returned: true,
                },
              )
              .then((response) => {
                // Update transactions in state
                const updatedTransactions = transactions.map((t) =>
                  t.id === transactionId ? response.data : t,
                );
                setTransactions(updatedTransactions);

                // If filter is set to active, remove this transaction from the filtered list
                if (filterStatus === "active") {
                  const updatedFiltered = filteredTransactions.filter(
                    (t) => t.id !== transactionId,
                  );
                  setFilteredTransactions(updatedFiltered);

                  // Adjust current page if needed
                  const newTotalPages = Math.ceil(
                    updatedFiltered.length / itemsPerPage,
                  );
                  if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                  }
                } else {
                  // Otherwise, update the transaction in the filtered list
                  const updatedFiltered = filteredTransactions.map((t) =>
                    t.id === transactionId ? response.data : t,
                  );
                  setFilteredTransactions(updatedFiltered);
                }

                fetchData(); // Refresh data
              })
              .catch((error) =>
                console.error("Error updating transaction:", error),
              );
          })
          .catch((error) => console.error("Error updating book:", error));
      })
      .catch((error) => console.error("Error updating member debt:", error));
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const totalPagesToShow = Math.min(5, totalPages);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + totalPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  // Calculate debt percentage for visual indicator
  const getDebtPercentage = (debt) => {
    return (debt / MAX_DEBT_LIMIT) * 100;
  };

  // Get debt status class
  const getDebtStatusClass = (debt) => {
    if (debt === 0) return "bg-success";
    if (debt < 250) return "bg-info";
    if (debt < 400) return "bg-warning text-dark";
    return "bg-danger";
  };

  // Add a function to handle book selection
  const handleBookSelection = (bookId) => {
    setSelectedBooks((prev) => {
      // If already selected, remove it
      if (prev.includes(bookId)) {
        return prev.filter((id) => id !== bookId);
      }
      // Otherwise add it
      return [...prev, bookId];
    });
  };

  return (
    <div className="transaction-list-container">
      <h1 className="section-title text-center mb-4">Transaction Management</h1>

      <div className="row mb-4">
        <div className="col-md-8">
          {/* Filter Controls */}
          <div className="card animate-fadeIn">
            <div className="card-body">
              <h5 className="card-title mb-3">Filter Transactions</h5>
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFilterStatus("all")}
                >
                  All Transactions
                </button>
                <button
                  type="button"
                  className={`btn ${filterStatus === "active" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFilterStatus("active")}
                >
                  Active Loans
                </button>
                <button
                  type="button"
                  className={`btn ${filterStatus === "returned" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFilterStatus("returned")}
                >
                  Returned Books
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-end">
          {/* Lend Books Button */}
          <button
            className="btn btn-success"
            onClick={() => setShowLendForm(!showLendForm)}
          >
            <i
              className={`fas ${showLendForm ? "fa-minus" : "fa-book"} me-1`}
            ></i>
            {showLendForm ? "Hide Form" : "Lend Books to Member"}
          </button>
        </div>
      </div>

      {/* Lend Books Form */}
      {showLendForm && (
        <div className="card mb-4 animate-slideIn">
          <div className="card-header">
            <h5 className="mb-0">Lend Books to Member</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Select Member</label>
                <div className="card">
                  <div className="card-header bg-light p-2">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search members..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={() => setMemberSearchTerm("")}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>

                  <div
                    className="card-body p-0"
                    style={{ maxHeight: "250px", overflowY: "auto" }}
                  >
                    {filteredMembersForLending.length === 0 ? (
                      <div className="p-3 text-center text-muted">
                        <i className="fas fa-search me-2"></i>
                        No matching members found
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {filteredMembersForLending.map((member) => (
                          <div
                            key={member.id}
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedMember === member.id ? "active" : ""}`}
                            onClick={() => setSelectedMember(member.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <div>
                              <div className="fw-bold">
                                <i className="fas fa-user me-2"></i>{" "}
                                {member.name}
                              </div>
                              {member.email && (
                                <div className="small text-muted">
                                  <i className="fas fa-envelope me-1"></i>{" "}
                                  {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="small text-muted">
                                  <i className="fas fa-phone me-1"></i>{" "}
                                  {member.phone}
                                </div>
                              )}
                              <div>
                                <span className="badge bg-secondary me-2">
                                  <i className="fas fa-pound-sign me-1"></i>{" "}
                                  {member.debt}
                                </span>
                                {member.debt === 0 ? (
                                  <span className="badge bg-success">
                                    No Debt
                                  </span>
                                ) : member.debt >=
                                  (member.maxDebt || MAX_DEBT_LIMIT) * 0.8 ? (
                                  <span className="badge bg-danger">
                                    High Debt
                                  </span>
                                ) : member.debt >=
                                  (member.maxDebt || MAX_DEBT_LIMIT) * 0.5 ? (
                                  <span className="badge bg-warning text-dark">
                                    Medium Debt
                                  </span>
                                ) : (
                                  <span className="badge bg-info">
                                    Low Debt
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              {selectedMember === member.id && (
                                <i className="fas fa-check-circle text-success"></i>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedMember && memberMap[selectedMember] && (
                    <div className="card-footer bg-light">
                      <div className="mt-2">
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className={`progress-bar ${getDebtStatusClass(memberMap[selectedMember].debt)}`}
                            role="progressbar"
                            style={{
                              width: `${getDebtPercentage(memberMap[selectedMember].debt)}%`,
                            }}
                            aria-valuenow={memberMap[selectedMember].debt}
                            aria-valuemin="0"
                            aria-valuemax={MAX_DEBT_LIMIT}
                          ></div>
                        </div>
                        <div className="d-flex justify-content-between">
                          <small>
                            Debt: EGP {memberMap[selectedMember].debt}
                          </small>
                          <small>Limit: EGP {MAX_DEBT_LIMIT}</small>
                        </div>

                        {calculatedDebt.booksAllowed < 1 && (
                          <div className="alert alert-danger mt-2 mb-0 py-1 small">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Debt limit reached
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Select Books to Lend</label>
                <div className="card">
                  <div className="card-header bg-light p-2">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search books..."
                        value={bookSearchTerm}
                        onChange={(e) => setBookSearchTerm(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={() => setBookSearchTerm("")}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>

                  <div className="card-header bg-light p-2 border-top">
                    <div className="d-flex flex-wrap">
                      {bookCategories.map((category) => (
                        <button
                          key={category}
                          className={`btn btn-sm me-1 mb-1 ${selectedCategory === category ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category === "all" ? "All Categories" : category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="card-body p-0"
                    style={{ maxHeight: "250px", overflowY: "auto" }}
                  >
                    {filteredBooksForLending.length === 0 ? (
                      <div className="p-3 text-center text-muted">
                        <i className="fas fa-search me-2"></i>
                        No matching books found
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {filteredBooksForLending.map((book) => (
                          <div
                            key={book.id}
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedBooks.includes(book.id) ? "active" : ""}`}
                            onClick={() => handleBookSelection(book.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <div>
                              <div className="fw-bold">{book.title}</div>
                              <small>{book.authors}</small>
                              <div>
                                <span className="badge bg-secondary me-2">
                                  <i className="fas fa-pound-sign me-1"></i>{" "}
                                  {book.debtCost || 50}
                                </span>
                                <span className="badge bg-info text-dark">
                                  {book.category || "Uncategorized"}
                                </span>
                              </div>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                              <span className="badge bg-success">
                                {book.availableCopies}/{book.totalCopies}{" "}
                                Available
                              </span>
                              {selectedBooks.includes(book.id) && (
                                <i className="fas fa-check-circle text-success mt-2"></i>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {selectedBooks.length} book
                        {selectedBooks.length !== 1 ? "s" : ""} selected
                      </small>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedBooks([])}
                        disabled={selectedBooks.length === 0}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>

                {selectedBooks.length > 0 && (
                  <div className="mt-2">
                    <h6>Selected Books:</h6>
                    <ul className="list-group">
                      {selectedBooks.map((bookId) => {
                        const book = bookMap[bookId];
                        return book ? (
                          <li
                            key={bookId}
                            className="list-group-item d-flex justify-content-between align-items-center py-2"
                          >
                            <div>
                              <span className="fw-bold">{book.title}</span>
                              <span className="badge bg-secondary ms-2">
                                <i className="fas fa-pound-sign me-1"></i>{" "}
                                {book.debtCost || 50}
                              </span>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookSelection(bookId);
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setShowLendForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleLendBooks}
                disabled={!selectedMember || selectedBooks.length === 0}
              >
                <i className="fas fa-paper-plane me-1"></i> Complete Transaction
              </button>
            </div>
            {selectedMember &&
              selectedBooks.length > 0 &&
              memberMap[selectedMember] && (
                <div className="alert alert-info mt-3">
                  <p className="mb-0">
                    <strong>Transaction Summary:</strong>
                  </p>
                  <p className="mb-1">
                    Member: {memberMap[selectedMember].name}
                  </p>
                  <p className="mb-1">Books: {selectedBooks.length}</p>
                  <p className="mb-1">
                    Total Cost: EGP {calculatedDebt.totalCost}
                  </p>
                  <p className="mb-1">
                    Current Debt: EGP {memberMap[selectedMember].debt}
                  </p>
                  <p className="mb-0">
                    New Total Debt: EGP {calculatedDebt.newTotalDebt}
                  </p>
                  {calculatedDebt.newTotalDebt > MAX_DEBT_LIMIT && (
                    <div className="alert alert-danger mt-2 mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <strong>Warning:</strong> This transaction will exceed the
                      maximum debt limit of EGP {MAX_DEBT_LIMIT}.
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Transaction Table */}
      {isLoading ? (
        <div className="text-center py-5 animate-fadeIn">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="alert alert-info animate-fadeIn">
          <i className="fas fa-info-circle me-2"></i>
          No transactions found.{" "}
          {filterStatus !== "all" && (
            <span>
              Try changing the filter or{" "}
              <button
                className="btn btn-link p-0"
                onClick={() => setFilterStatus("all")}
              >
                view all transactions
              </button>
              .
            </span>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive animate-fadeIn d-none d-md-block">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Date</th>
                  <th>Debt Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((transaction) => {
                  const book = bookMap[transaction.bookID];
                  // Get debt cost from transaction or from book or default
                  const debtCost =
                    transaction.debtCost || (book ? book.debtCost : 50);

                  return (
                    <tr
                      key={transaction.id}
                      className={
                        transaction.returned ? "" : "table-warning fw-bold"
                      }
                    >
                      <td>{transaction.id}</td>
                      <td>
                        <i className="fas fa-book me-2"></i>
                        {book?.title || `Book ID: ${transaction.bookID}`}
                      </td>
                      <td>
                        <i className="fas fa-user me-2"></i>
                        {memberMap[transaction.memberID]?.name ||
                          `Member ID: ${transaction.memberID}`}
                      </td>
                      <td>
                        <i className="fas fa-calendar-alt me-2"></i>
                        {transaction.date}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          <i className="fas fa-pound-sign me-1"></i> {debtCost}
                        </span>
                      </td>
                      <td>
                        {transaction.returned ? (
                          <span className="badge bg-success">
                            <i className="fas fa-check-circle me-1"></i>{" "}
                            Returned
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            <i className="fas fa-clock me-1"></i> Active Loan
                          </span>
                        )}
                      </td>
                      <td>
                        {!transaction.returned && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReturnBook(transaction.id)}
                          >
                            <i className="fas fa-undo-alt me-1"></i> Return Book
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View with 3D effect */}
          <div className="d-md-none animate-fadeIn">
            {displayedTransactions.map((transaction) => {
              const book = bookMap[transaction.bookID];
              const debtCost =
                transaction.debtCost || (book ? book.debtCost : 50);

              return (
                <div
                  key={transaction.id}
                  className={`card mb-4 card-3d-effect ${transaction.returned ? "border-light" : "border-warning"}`}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-exchange-alt me-2"></i> Transaction #
                      {transaction.id}
                    </h5>
                    {transaction.returned ? (
                      <span className="badge bg-success">
                        <i className="fas fa-check-circle me-1"></i> Returned
                      </span>
                    ) : (
                      <span className="badge bg-warning text-dark">
                        <i className="fas fa-clock me-1"></i> Active Loan
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <small className="text-muted d-block">Book:</small>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-book me-2 text-primary"></i>
                        <strong>
                          {book?.title || `Book ID: ${transaction.bookID}`}
                        </strong>
                      </div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Member:</small>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-user me-2 text-primary"></i>
                        <strong>
                          {memberMap[transaction.memberID]?.name ||
                            `Member ID: ${transaction.memberID}`}
                        </strong>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <small className="text-muted d-block">Date:</small>
                        <div>
                          <i className="fas fa-calendar-alt me-2 text-secondary"></i>
                          {transaction.date}
                        </div>
                      </div>
                      <div>
                        <small className="text-muted d-block">Debt Cost:</small>
                        <div>
                          <span className="badge bg-secondary">
                            <i className="fas fa-pound-sign me-1"></i>{" "}
                            {debtCost}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!transaction.returned && (
                      <div className="text-end mt-3">
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleReturnBook(transaction.id)}
                        >
                          <i className="fas fa-undo-alt me-1"></i> Return Book
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="animate-fadeIn" style={{ animationDelay: "0.2s" }}>
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="d-flex align-items-center">
                <label className="me-2">Items per page:</label>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="ms-3">
                  Showing{" "}
                  {filteredTransactions.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length,
                  )}{" "}
                  of {filteredTransactions.length} transactions
                </span>
              </div>

              <nav aria-label="Transaction list pagination">
                <ul className="pagination mb-0">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                  </li>
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-left"></i>
                    </button>
                  </li>

                  {getPageNumbers().map((number) => (
                    <li
                      key={number}
                      className={`page-item ${currentPage === number ? "active" : ""}`}
                    >
                      <button
                        className={`page-link ${currentPage === number ? "text-white" : ""}`}
                        onClick={() => setCurrentPage(number)}
                      >
                        {number}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-right"></i>
                    </button>
                  </li>
                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Transaction Summary Cards */}
      {!isLoading && transactions.length > 0 && (
        <div
          className="row mt-4 animate-fadeIn"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="card-title">Total Transactions</h5>
                <h2 className="display-4 animate-pulse">
                  {transactions.length}
                </h2>
                <p className="text-muted">All-time transaction count</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="card-title">Active Loans</h5>
                <h2 className="display-4">
                  {transactions.filter((t) => !t.returned).length}
                </h2>
                <p className="text-muted">Books currently lent out</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="card-title">Total Revenue</h5>
                <h2 className="display-4 animate-pulse">
                  EGP{" "}
                  {transactions.reduce((sum, t) => {
                    const book = bookMap[t.bookID];
                    return sum + (t.debtCost || (book ? book.debtCost : 50));
                  }, 0)}
                </h2>
                <p className="text-muted">Based on each book's debt cost</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
