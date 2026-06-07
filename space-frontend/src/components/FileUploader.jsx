import { useState } from "react";
import { motion } from "framer-motion";
import api from "../api/apiClient";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }

    setError("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await api.post("/upload", formData);

      setUploadResult(res.data);
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
        );
      } else {
        setError(
          "Upload failed. Please verify the spreadsheet format."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md border border-gray-200 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Upload Space Inventory
        </h2>

        <p className="text-gray-500 mt-2">
          Upload a Bluebeam Revu or Excel export to populate
          your dashboard and inventory database.
        </p>
      </div>

      {/* File Picker */}

      <label className="block">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition">
          <p className="text-gray-600 font-medium">
            Click to select an Excel file
          </p>

          <p className="text-gray-400 text-sm mt-2">
            Supported formats: .xlsx, .xls
          </p>

          {file && (
            <div className="mt-4 text-gray-800 font-medium">
              📄 {file.name}
            </div>
          )}
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files.length > 0) {
              setFile(e.target.files[0]);
            }
          }}
        />
      </label>

      {/* Upload Button */}

      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {/* Loading */}

      {loading && (
        <div className="mt-4 text-sm text-gray-500">
          Processing spreadsheet...
        </div>
      )}

      {/* Error */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-700">
            Upload Failed
          </h3>

          <p className="text-red-600 mt-2 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* Success */}

      {uploadResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-700">
            Upload Successful
          </h3>

          <p className="text-green-600 mt-2">
            {uploadResult.message}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">
                Rooms Loaded
              </div>

              <div className="text-2xl font-bold text-gray-800">
                {uploadResult.rooms_loaded ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">
                Status
              </div>

              <div className="text-2xl font-bold text-green-600">
                Ready
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}