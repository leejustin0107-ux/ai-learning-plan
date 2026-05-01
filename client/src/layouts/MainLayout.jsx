import { Outlet, NavLink } from 'react-router-dom';
export default function MainLayout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <h2>AI Learning Plan</h2>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/goals">Goals</NavLink>
        <NavLink to="/calendar">Kalender</NavLink>
        <NavLink to="/progress">Progress</NavLink>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}