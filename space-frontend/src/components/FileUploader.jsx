import { useState } from "react";
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
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-2xl mb-4 font-semibold">Upload Space Data</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Upload
      </button>
      <p className="mt-3">{message}</p>
    </div>
  );
}