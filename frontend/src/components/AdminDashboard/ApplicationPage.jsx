import React, { useState } from 'react';
import './ApplicationPage.css';

const ApplicationPage = () => {
  const initialData = [
    {
      id: 1,
      name: 'Maam May Garcia',
      email: 'May@university.edu',
      role: 'Faculty',
      roleColor: 'green',
      department: 'College of Science',
      status: 'Pending',
      statusColor: 'yellow',
      date: '2 hours ago'
    },
    {
      id: 2,
      name: 'Jay Rubert Lachica',
      email: 'Jayjay@student.edu',
      role: 'Student',
      roleColor: 'blue',
      department: 'Engineering',
      status: 'Pending',
      statusColor: 'yellow',
      date: '1 day ago'
    },
    {
      id: 3,
      name: 'Angelica Terana',
      email: 'Anggega@university.edu',
      role: 'Admin',
      roleColor: 'red',
      department: 'IT Services',
      status: 'Pending',
      statusColor: 'yellow',
      date: '5 min ago'
    },
    {
      id: 4,
      name: 'Prof. Emman Wilson',
      email: 'emma.wilson@university.edu',
      role: 'Faculty',
      roleColor: 'green',
      department: 'Mathematics',
      status: 'Cancelled',
      statusColor: 'red',
      date: '3 hours ago'
    },
    {
      id: 5,
      name: 'Alex Cunsani',
      email: 'alex.cunsani@student.edu',
      role: 'Student',
      roleColor: 'blue',
      department: 'Business',
      status: 'Approved',
      statusColor: 'green',
      date: '2 days ago'
    },
  ];

  const [applications, setApplications] = useState(initialData);
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalUser, setModalUser] = useState(null);

  // FILTERING LOGIC
  const filteredApps = applications.filter((item) => {
    const roleMatch = roleFilter === "All" || item.role === roleFilter;
    const statusMatch = statusFilter === "Status" || item.status === statusFilter;
    const searchMatch =
      item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.department.toLowerCase().includes(searchValue.toLowerCase());

    return roleMatch && statusMatch && searchMatch;
  });

  // ACTION HANDLERS
  const updateStatus = (id, newStatus) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === id
          ? {
              ...app,
              status: newStatus,
              statusColor:
                newStatus === "Approved"
                  ? "green"
                  : newStatus === "Rejected" || newStatus === "Cancelled"
                  ? "red"
                  : "yellow"
            }
          : app
      )
    );
    setOpenMenuId(null);
  };

  const deleteApplication = (id) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    setOpenMenuId(null);
  };

  return (
    <div className="application-container">

      {/* Filter Bar */}
      <div className="app-filter-bar">
        <div className="app-filter-left">
          <select
            className="app-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option>All</option>
            <option>Faculty</option>
            <option>Student</option>
            <option>Admin</option>
          </select>

          <select
            className="app-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Cancelled</option>
            <option>Rejected</option>
          </select>

          <div className="app-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card app-list-card">
        <div className="app-list-header">
          <h2>Application List</h2>
        </div>

        <div className="app-table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date Applied</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id} className="user-row"  onClick={() => setModalUser(app)}>
                  {/* Entire user cell clickable */}
                  <td 
                    className="user-cell" 

                  >
                    <div className="user-info-cell">
                      <div className="user-table-avatar">
                        <i className="fas fa-user-circle"></i>
                      </div>
                      <div>
                        <span className="user-table-name">{app.name}</span>
                        <span className="user-table-email">{app.email}</span>
                      </div>
                    </div>
                  </td>

                  <td><span className={`role-tag ${app.roleColor}`}>{app.role}</span></td>
                  <td>{app.department}</td>
                  <td><span className={`status-tag ${app.statusColor}`}>{app.status}</span></td>
                  <td>{app.date}</td>

                  {/* Small dropdown actions */}
                  <td className="actions-cell">
                    <div className="dropdown-container">
                      <button
                        className="action-button"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setOpenMenuId(openMenuId === app.id ? null : app.id);
                        }}
                      >
                        <i className="fas fa-ellipsis-h"></i>
                      </button>

                      {openMenuId === app.id && (
                        <div className="action-dropdown">
                          <button onClick={() => updateStatus(app.id, "Approved")}>Approve</button>
                          <button onClick={() => updateStatus(app.id, "Rejected")}>Reject</button>
                          <button onClick={() => deleteApplication(app.id)} className="delete">Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 20, color: "#888" }}>
                    No results found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {modalUser && (
        <div className="modal-backdrop" onClick={() => setModalUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{modalUser.name}</h3>
            <p><strong>Email:</strong> {modalUser.email}</p>
            <p><strong>Role:</strong> {modalUser.role}</p>
            <p><strong>Department:</strong> {modalUser.department}</p>
            <p><strong>Status:</strong> {modalUser.status}</p>
            <p><strong>Date Applied:</strong> {modalUser.date}</p>
            <button onClick={() => setModalUser(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationPage;
