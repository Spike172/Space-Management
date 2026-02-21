import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/apiClient";

export default function FileUploader({ onUpload }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      const res = await api.post("/upload", formData);
      onUpload(res.data.summary); // pass data up to App
      setMessage("✅ " + res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Upload Space Data (Excel)
      </h2>
      <p className="text-gray-500 mb-6">
        Upload your Excel file exported from Bluebeam Revu or another source.
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4 bg-gray-50"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading..." : "Upload File"}
      </button>

      {message && (
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      )}

      {loading && (
        <p className="mt-2 text-gray-400 text-sm">
          This may take a moment if the server is waking up...
        </p>
      )}
    </motion.div>
  );
}