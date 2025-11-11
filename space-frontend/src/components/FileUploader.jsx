import { useState } from 'react'
import axios from 'axios'

export default function FileUploader() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')

  const handleFile = (e) => setFile(e.target.files[0])

  const uploadFile = async () => {
    if (!file) return setStatus('Pick a file first')
    const form = new FormData()
    form.append('file', file)
    setStatus('Uploading...')
    try {
      const res = await axios.post('/etl/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStatus(`Upload complete: ${res.data?.message || 'OK'}`)
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`)
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <input type="file" onChange={handleFile} accept=".csv,.xlsx,.xml" />
      <button
        onClick={uploadFile}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload
      </button>
      <p className="mt-2 text-gray-700">{status}</p>
    </div>
  )
}
