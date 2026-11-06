import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        Certificate Studio · Your tools, in one place
      </footer>
    </div>
  );
}