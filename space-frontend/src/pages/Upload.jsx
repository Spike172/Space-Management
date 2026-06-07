// src/pages/Upload.jsx

import FileUploader from "../components/FileUploader";

export default function Upload() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-3xl font-bold mb-2">Upload Data</h1>
        <p className="text-gray-600">
          Import Bluebeam Revu exports, Excel spreadsheets, or other space
          management data files.
        </p>
      </div>

      <FileUploader />
    </div>
  );
}