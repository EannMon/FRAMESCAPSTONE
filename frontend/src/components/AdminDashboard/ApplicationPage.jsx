import React from 'react';
import './ApplicationPage.css'; // New CSS file for this page

// ===========================================
// Application Page Component
// ===========================================

const ApplicationPage = () => {
  
  // Mock data for the table based on the image
  const applications = [
    {
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

  return (
    <div className="application-container">
      {/* Filter Bar */}
      <div className="app-filter-bar">
        <div className="app-filter-left">
          <select className="app-filter-select">
            <option>All</option>
            <option>Faculty</option>
            <option>Student</option>
            <option>Admin</option>
          </select>
          <select className="app-filter-select">
            <option>Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Cancelled</option>
          </select>
          <div className="app-search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search..." />
          </div>
        </div>
        <div className="app-filter-right">
          <button className="add-user-button">
            <i className="fas fa-plus"></i> Add User
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card app-list-card">
        <div className="app-list-header">
          <h2>All Users</h2>
          {/* You can add a toggle icon here if needed */}
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
                <th></th> {/* Actions column */}
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={index}>
                  <td>
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
                  <td>
                    <button className="action-button"><i className="fas fa-ellipsis-h"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPage;