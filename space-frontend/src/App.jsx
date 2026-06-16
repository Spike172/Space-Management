// src/App.jsx

import { useState } from "react";
import {HashRouter, Routes, Route, NavLink, useNavigate} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Upload from "./pages/Upload";
import Editor from "./pages/Editor";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const navigate = useNavigate();

  const navItemClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Navigation */}

      <nav className="bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">
            🏢 Space Managment
          </h1>

          <div className="flex items-center gap-4">
            {/* Navigation Links */}

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

            {/* User Menu */}

            <div className="relative">
              {!user ? (
                <NavLink
                  to="/login"
                  className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition"
                >
                  👤
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setMenuOpen(!menuOpen)
                    }
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center"
                  >
                    {user.username
                      ?.charAt(0)
                      .toUpperCase()}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-50">
                      <div className="p-4 border-b">
                        <p className="font-semibold">
                          {user.username}
                        </p>
                      </div>
                      
                      <div className="p-2 border-b">
                        <button
                          onClick={logout}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-red-400"
                        >
                          Logout
                        </button>
                      </div>

                      <div className="p-4 border-b">
                        <p className="text-[0.5rem] text-gray-400 break-all mt-1 py-1">
                          {user.user_id}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}

      <main className="max-w-7xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>}/>

          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>}/>

          <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>}/>

          <Route path="/login" element={<Login />}/>

          <Route path="/register" element={<Register />}/>
        </Routes>
      </main>

      {/* Footer */}

      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Space Management Dashboard
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}