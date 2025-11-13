import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FileUploader from "./components/FileUploader";

export default function App() {
  const navItemClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <nav className="bg-gray-900 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">🏢 Space Manager</h1>
        <div className="flex space-x-2">
          <NavLink to="/" className={navItemClass}>
            Dashboard
          </NavLink>
          <NavLink to="/upload" className={navItemClass}>
            Upload
          </NavLink>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<FileUploader />} />
        </Routes>
      </main>

      <footer className="text-center text-gray-500 text-sm py-6">
        © {new Date().getFullYear()} Space Management Dashboard
      </footer>
    </div>
  );
}