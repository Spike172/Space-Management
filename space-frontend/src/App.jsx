// src/App.jsx

import { HashRouter, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Upload from "./pages/Upload";
import Editor from "./pages/Editor";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
        {/* Navigation */}
        <nav className="bg-gray-900 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">
              🏢 Space Manager
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
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

              {/* User Icon */}
              <NavLink
                to="/login"
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition"
              >
                👤
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/editor" element={<Editor />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Space Management Dashboard
          </div>
        </footer>
      </div>
    </HashRouter>
  );
}