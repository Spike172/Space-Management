import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/apiClient";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/upload", formData);
      setMessage(res.data.message);
    } catch (err) {
      console.error(err)
      setMessage("❌ Upload failed.");
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
        className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4 bg-gray-50"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={handleUpload}
        className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
      >
        Upload File
      </button>

      {message && (
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      )}
    </motion.div>
  );
}