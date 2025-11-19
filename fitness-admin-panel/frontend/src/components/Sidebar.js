import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">FitnessHub</div>
        <div className="sidebar-subtitle">Admin Panel</div>
      </div>

      <nav>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>📊</span> Dashboard
            </NavLink>
          </li>

          <div className="sidebar-section">User Management</div>
          <li>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>👥</span> Users
            </NavLink>
          </li>
          <li>
            <NavLink to="/plans" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>💳</span> Membership Plans
            </NavLink>
          </li>

          <div className="sidebar-section">Content</div>
          <li>
            <NavLink to="/programs" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🏋️</span> Workout Programs
            </NavLink>
          </li>
          <li>
            <NavLink to="/articles" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>📝</span> Articles
            </NavLink>
          </li>
          <li>
            <NavLink to="/nutrition" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🥗</span> Nutrition Plans
            </NavLink>
          </li>

          <div className="sidebar-section">Classes</div>
          <li>
            <NavLink to="/classes" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🧘</span> Class Types
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>📅</span> Schedule
            </NavLink>
          </li>

          <div className="sidebar-section">E-Commerce</div>
          <li>
            <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🛍️</span> Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>📦</span> Orders
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="user-info">
        <div className="user-name">{user?.firstName} {user?.lastName}</div>
        <div className="user-role">{user?.role}</div>
        <button onClick={logout} className="btn btn-secondary btn-sm mt-2" style={{ width: '100%' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
