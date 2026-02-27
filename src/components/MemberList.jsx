import React, { useState, useEffect } from "react";
import axios from "axios";
import API_CONFIG from "../config/api";

const MemberList = () => {
  // Define system-wide maximum debt limit as a constant
  const SYSTEM_MAX_DEBT_LIMIT = 500;

  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    name: "",
    debt: 0,
    maxDebt: SYSTEM_MAX_DEBT_LIMIT,
    email: "",
    phone: "",
  });
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [displayedMembers, setDisplayedMembers] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch members from API
  const fetchMembers = () => {
    setIsLoading(true);
    axios
      .get(API_CONFIG.getResourceUrl("members"))
      .then((response) => {
        // Set default maxDebt if missing in existing members
        const membersWithMaxDebt = response.data.map((member) => ({
          ...member,
          maxDebt: member.maxDebt || SYSTEM_MAX_DEBT_LIMIT,
        }));

        setMembers(membersWithMaxDebt);
        setFilteredMembers(membersWithMaxDebt);
        setTotalPages(Math.ceil(membersWithMaxDebt.length / itemsPerPage));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching members:", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Update displayed members when filtered members or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedMembers(filteredMembers.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredMembers.length / itemsPerPage));
  }, [filteredMembers, currentPage, itemsPerPage]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();

    if (searchTerm.trim() === "") {
      setFilteredMembers(members);
      setCurrentPage(1);
      return;
    }

    const filtered = members.filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredMembers(filtered);
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value === "") {
      setFilteredMembers(members);
    }
  };

  // Handle max debt limit change
  const handleMaxDebtChange = (e) => {
    let value = e.target.value;

    // Handle empty input
    if (value === "") {
      setNewMember({ ...newMember, maxDebt: SYSTEM_MAX_DEBT_LIMIT });
      return;
    }

    // Convert to number and validate
    let numericValue = parseInt(value);

    // Ensure it's a valid number
    if (isNaN(numericValue)) {
      return;
    }

    // Enforce boundaries
    if (numericValue < 0) {
      numericValue = 0;
    } else if (numericValue > SYSTEM_MAX_DEBT_LIMIT) {
      numericValue = SYSTEM_MAX_DEBT_LIMIT;
    }

    setNewMember({ ...newMember, maxDebt: numericValue });
  };

  // Handle adding a new member
  const handleAddMember = () => {
    if (!newMember.name) {
      alert("Member name is required");
      return;
    }

    // Always set initial debt to 0 when adding a new member
    const memberToAdd = {
      name: newMember.name,
      debt: 0,
      maxDebt: newMember.maxDebt,
      email: newMember.email || "",
      phone: newMember.phone || "",
    };

    axios
      .post(API_CONFIG.getResourceUrl("members"), memberToAdd)
      .then((response) => {
        const updatedMembers = [...members, response.data];
        setMembers(updatedMembers);
        setFilteredMembers(updatedMembers);
        setNewMember({
          name: "",
          debt: 0,
          maxDebt: SYSTEM_MAX_DEBT_LIMIT,
          email: "",
          phone: "",
        });
        setShowAddMemberForm(false);

        // Go to the last page to see the new member
        setCurrentPage(Math.ceil(updatedMembers.length / itemsPerPage));
      })
      .catch((error) => console.error("Error adding member:", error));
  };

  // Handle deleting a member
  const handleDeleteMember = (id) => {
    // First check if the member has outstanding debt
    const member = members.find((m) => m.id === id);

    if (member.debt > 0) {
      alert(
        `Cannot delete a member with outstanding debt of EGP ${member.debt}`,
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this member?")) {
      axios
        .delete(API_CONFIG.getResourceItemUrl("members", id))
        .then(() => {
          const updatedMembers = members.filter((member) => member.id !== id);
          setMembers(updatedMembers);
          setFilteredMembers(updatedMembers);

          // Adjust current page if needed
          const newTotalPages = Math.ceil(updatedMembers.length / itemsPerPage);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          }
        })
        .catch((error) => console.error("Error deleting the member:", error));
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Get debt status class
  const getDebtStatusClass = (debt, maxDebt) => {
    if (debt === 0) return "bg-success";

    const debtPercentage = (debt / maxDebt) * 100;

    if (debtPercentage < 50) return "bg-info";
    if (debtPercentage < 80) return "bg-warning text-dark";
    return "bg-danger";
  };

  // Calculate debt percentage
  const getDebtPercentage = (debt, maxDebt) => {
    return (debt / maxDebt) * 100;
  };

  // Add pagination controls function
  const renderPaginationControls = () => {
    return (
      <div className="d-flex justify-content-between align-items-center flex-column flex-md-row mt-3">
        <div className="mb-3 mb-md-0 w-100 w-md-auto">
          <select
            className="form-select form-select-sm"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            style={{ width: "auto", display: "inline-block" }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <span className="ms-2 d-none d-sm-inline">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of{" "}
            {filteredMembers.length}
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-left"></i>
          </button>

          <span className="mx-2 d-flex align-items-center">
            <span className="d-none d-sm-inline">Page</span> {currentPage}{" "}
            <span className="d-none d-sm-inline">of</span>{" "}
            <span className="d-inline d-sm-none">/</span> {totalPages}
          </span>

          <button
            className="btn btn-sm btn-outline-primary me-1"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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
    );
  };

  return (
    <div className="member-list-container">
      <h1 className="section-title text-center mb-4">Member Management</h1>

      <div className="row mb-4">
        <div className="col-lg-8 col-md-7 col-sm-12 mb-3 mb-md-0">
          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="mb-2 mb-md-4 search-form-mobile"
          >
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="btn btn-primary d-none d-sm-inline-block"
              >
                <i className="fas fa-search me-1"></i> Search
              </button>
              <button type="submit" className="btn btn-primary d-sm-none">
                <i className="fas fa-search"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-none d-sm-inline-block"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredMembers(members);
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times me-1"></i> Clear
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary d-sm-none"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredMembers(members);
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </form>
        </div>
        <div className="col-lg-4 col-md-5 col-sm-12 text-md-end text-center">
          {/* Add Member Button */}
          <button
            className="btn btn-success w-100 w-md-auto"
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
          >
            <i
              className={`fas ${showAddMemberForm ? "fa-minus" : "fa-plus"} me-1`}
            ></i>
            {showAddMemberForm ? "Hide Form" : "Add New Member"}
          </button>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddMemberForm && (
        <div className="card mb-4 animate-slideIn">
          <div className="card-header">
            <h5 className="mb-0">Add New Member</h5>
          </div>
          <div className="card-body">
            <div className="row row-tablet-adjust">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
                <label htmlFor="memberName" className="form-label">
                  Member Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="memberName"
                  placeholder="Enter member name"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  required
                />
                <div className="form-text">
                  New members start with zero debt. Debt increases when books
                  are borrowed.
                </div>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
                <label htmlFor="maxDebtLimit" className="form-label">
                  Maximum Debt Limit
                </label>
                <div className="input-group">
                  <span className="input-group-text">EGP</span>
                  <input
                    type="number"
                    className="form-control"
                    id="maxDebtLimit"
                    placeholder={SYSTEM_MAX_DEBT_LIMIT.toString()}
                    min="50"
                    max={SYSTEM_MAX_DEBT_LIMIT}
                    value={newMember.maxDebt}
                    onChange={handleMaxDebtChange}
                  />
                </div>
                <div className="form-text">
                  Maximum system-wide limit is EGP {SYSTEM_MAX_DEBT_LIMIT}
                </div>

                {/* Visual max debt indicator */}
                <div className="mt-2">
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{
                        width: `${(newMember.maxDebt / SYSTEM_MAX_DEBT_LIMIT) * 100}%`,
                      }}
                      aria-valuenow={newMember.maxDebt}
                      aria-valuemin="0"
                      aria-valuemax={SYSTEM_MAX_DEBT_LIMIT}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <small>EGP 0</small>
                    <small>EGP {SYSTEM_MAX_DEBT_LIMIT}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="row row-tablet-adjust">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
                <label htmlFor="memberEmail" className="form-label">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="memberEmail"
                    placeholder="Enter email address"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-text">
                  Used for notifications and communications
                </div>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-3">
                <label htmlFor="memberPhone" className="form-label">
                  Phone Number
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-phone"></i>
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    id="memberPhone"
                    placeholder="Enter phone number"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({ ...newMember, phone: e.target.value })
                    }
                  />
                </div>
                <div className="form-text">Used for urgent communications</div>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-end">
              <button
                type="button"
                className="btn btn-secondary mb-2 mb-sm-0 me-sm-2 w-100 w-sm-auto"
                onClick={() => {
                  setShowAddMemberForm(false);
                  setNewMember({
                    name: "",
                    debt: 0,
                    maxDebt: SYSTEM_MAX_DEBT_LIMIT,
                    email: "",
                    phone: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary w-100 w-sm-auto"
                onClick={handleAddMember}
                disabled={!newMember.name}
              >
                <i className="fas fa-save me-1"></i> Save Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Members */}
      {isLoading ? (
        <div className="text-center py-5 animate-fadeIn">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="alert alert-info animate-fadeIn">
          <i className="fas fa-info-circle me-2"></i>
          No members found.{" "}
          {searchTerm && (
            <span>
              Try a different search term or{" "}
              <button
                className="btn btn-link p-0"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredMembers(members);
                }}
              >
                clear the search
              </button>
              .
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive animate-fadeIn d-none d-md-block">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Debt</th>
                  <th>Status</th>
                  <th>Maximum Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={member.debt > 0 ? "table-warning" : ""}
                  >
                    <td>{member.id}</td>
                    <td>
                      <i className="fas fa-user me-2"></i>
                      {member.name}
                    </td>
                    <td>
                      {member.email ? (
                        <a
                          href={`mailto:${member.email}`}
                          className="text-decoration-none"
                        >
                          <i className="fas fa-envelope me-1"></i>{" "}
                          {member.email}
                        </a>
                      ) : (
                        <span className="text-muted">
                          <i className="fas fa-envelope me-1"></i> Not provided
                        </span>
                      )}
                    </td>
                    <td>
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="text-decoration-none"
                        >
                          <i className="fas fa-phone me-1"></i> {member.phone}
                        </a>
                      ) : (
                        <span className="text-muted">
                          <i className="fas fa-phone me-1"></i> Not provided
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">EGP {member.debt}</span>
                        <div
                          className="progress flex-grow-1"
                          style={{ height: "8px" }}
                        >
                          <div
                            className={`progress-bar ${getDebtStatusClass(member.debt, member.maxDebt)}`}
                            role="progressbar"
                            style={{
                              width: `${getDebtPercentage(member.debt, member.maxDebt)}%`,
                            }}
                            aria-valuenow={member.debt}
                            aria-valuemin="0"
                            aria-valuemax={member.maxDebt}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${getDebtStatusClass(member.debt, member.maxDebt)}`}
                      >
                        {member.debt === 0
                          ? "No Debt"
                          : getDebtPercentage(member.debt, member.maxDebt) >= 80
                            ? "High Debt"
                            : getDebtPercentage(member.debt, member.maxDebt) >=
                                50
                              ? "Medium Debt"
                              : "Low Debt"}
                      </span>
                    </td>
                    <td>EGP {member.maxDebt || SYSTEM_MAX_DEBT_LIMIT}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={member.debt > 0}
                        title={
                          member.debt > 0
                            ? "Cannot delete a member with outstanding debt"
                            : "Delete this member"
                        }
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none animate-fadeIn">
            {displayedMembers.map((member) => (
              <div
                key={member.id}
                className={`card mb-3 card-3d-effect ${member.debt > 0 ? "border-warning" : "border-light"}`}
              >
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-user me-2"></i> {member.name}
                  </h5>
                  <span
                    className={`badge ${getDebtStatusClass(member.debt, member.maxDebt)}`}
                  >
                    {member.debt === 0
                      ? "No Debt"
                      : getDebtPercentage(member.debt, member.maxDebt) >= 80
                        ? "High Debt"
                        : getDebtPercentage(member.debt, member.maxDebt) >= 50
                          ? "Medium Debt"
                          : "Low Debt"}
                  </span>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <small className="text-muted d-block">ID:</small>
                    <div>{member.id}</div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Email:</small>
                    <div>
                      {member.email ? (
                        <a
                          href={`mailto:${member.email}`}
                          className="text-decoration-none"
                        >
                          <i className="fas fa-envelope me-1"></i>{" "}
                          {member.email}
                        </a>
                      ) : (
                        <span className="text-muted">
                          <i className="fas fa-envelope me-1"></i> Not provided
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Phone:</small>
                    <div>
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="text-decoration-none"
                        >
                          <i className="fas fa-phone me-1"></i> {member.phone}
                        </a>
                      ) : (
                        <span className="text-muted">
                          <i className="fas fa-phone me-1"></i> Not provided
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Debt:</small>
                    <div className="d-flex align-items-center">
                      <span className="me-2">EGP {member.debt}</span>
                      <div
                        className="progress flex-grow-1"
                        style={{ height: "8px" }}
                      >
                        <div
                          className={`progress-bar ${getDebtStatusClass(member.debt, member.maxDebt)}`}
                          role="progressbar"
                          style={{
                            width: `${getDebtPercentage(member.debt, member.maxDebt)}%`,
                          }}
                          aria-valuenow={member.debt}
                          aria-valuemin="0"
                          aria-valuemax={member.maxDebt}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Maximum Limit:</small>
                    <div>EGP {member.maxDebt || SYSTEM_MAX_DEBT_LIMIT}</div>
                  </div>
                  <div className="text-end">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteMember(member.id)}
                      disabled={member.debt > 0}
                    >
                      <i className="fas fa-trash-alt me-1"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination with animation */}
          <div
            className="animate-fadeIn pagination-container"
            style={{ animationDelay: "0.2s" }}
          >
            {renderPaginationControls()}
          </div>
        </>
      )}

      {/* Debt Summary Card */}
      {!isLoading && filteredMembers.length > 0 && (
        <div
          className="card mt-4 animate-fadeIn"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="card-header">
            <h5 className="mb-0">Debt Summary</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 col-lg-3 mb-3">
                <div className="card bg-light h-100">
                  <div className="card-body text-center py-3">
                    <h3 className="animate-pulse">{filteredMembers.length}</h3>
                    <p className="mb-0">Total Members</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-3">
                <div className="card bg-light h-100">
                  <div className="card-body text-center py-3">
                    <h3 className="animate-pulse">
                      EGP{" "}
                      {filteredMembers.reduce(
                        (sum, member) => sum + parseInt(member.debt || 0),
                        0,
                      )}
                    </h3>
                    <p className="mb-0">Total Debt</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-3">
                <div className="card bg-light h-100">
                  <div className="card-body text-center py-3">
                    <h3>
                      {
                        filteredMembers.filter((member) => member.debt > 0)
                          .length
                      }
                    </h3>
                    <p className="mb-0">Members with Debt</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 mb-3">
                <div className="card bg-light h-100">
                  <div className="card-body text-center py-3">
                    <h3>
                      {
                        filteredMembers.filter((member) => member.debt === 0)
                          .length
                      }
                    </h3>
                    <p className="mb-0">Members without Debt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
