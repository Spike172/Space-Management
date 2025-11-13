import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FileUploader from "./components/FileUploader";

export default function App() {
  return (
    <HashRouter>
      <nav className="bg-gray-900 text-white p-4 flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/upload">Upload</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<FileUploader />} />
      </Routes>
    </HashRouter>
  );
}