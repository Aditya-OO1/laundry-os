import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">L</div>
          <div>
            <div className="logo-name">LaundryOS</div>
            <div className="logo-sub">Order Management</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Orders
          </NavLink>
          <NavLink to="/orders/new" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            + New Order
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
