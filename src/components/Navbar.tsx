import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">C</span>
        <span>
          <strong>Certificate</strong>
          <span className="brand-subtitle">STUDIO</span>
        </span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/bulk">Bulk Certificates</NavLink>
        <NavLink to="/editor">Editor</NavLink>
      </nav>

      <span className="offline-label">
        <span className="status-dot" />
        Offline-first
      </span>
    </header>
  );
}