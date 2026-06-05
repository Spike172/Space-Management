import { HashRouter, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Editor from "./pages/Editor";

import FileUploader from "./components/FileUploader";

export default function App() {
  const navItemClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        {/* Header */}
        <nav className="bg-gray-900 shadow-md p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">
            🏢 Space Management Platform
          </h1>

          <div className="flex space-x-2">
            <NavLink to="/" className={navItemClass}>
              Dashboard
            </NavLink>

            <NavLink to="/upload" className={navItemClass}>
              Upload
            </NavLink>

            <NavLink to="/inventory" className={navItemClass}>
              Inventory
            </NavLink>

            <NavLink to="/editor" className={navItemClass}>
              Floor Plan
            </NavLink>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto mt-8 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/upload"
              element={<FileUploader />}
            />

            <Route
              path="/inventory"
              element={<Inventory />}
            />

            <Route
              path="/editor"
              element={<Editor />}
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t mt-12">
          © {new Date().getFullYear()} Space Management Dashboard
        </footer>
      </div>
    </HashRouter>
  );
}