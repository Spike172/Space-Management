// src/pages/Inventory.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";

export default function Inventory() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("building");
  const [sortDirection, setSortDirection] = useState("asc");
  const [error, setError] = useState(null);

  // 1. Load the list of projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // 2. Load the inventory whenever the chosen project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadInventory(selectedProjectId);
    } else {
      setRooms([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(res.data || []);
      
      // Auto-select the first project in the list if available
      if (res.data && res.data.length > 0) {
        setSelectedProjectId(res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Unable to retrieve projects list.");
      setLoading(false);
    }
  };

  const loadInventory = async (projectId) => {
    try {
      setLoading(true);
      // Pass the query parameter expected by your modified FastAPI endpoint
      const res = await api.get(`/spaces?project_id=${projectId}`);
      setRooms(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load spaces inventory:", err);
      setError("Unable to load project inventory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const formatFloor = (floor) => {
    if (!floor || floor === "Unknown") return "Unknown";
    return floor;
  };

  // Memoized filter and sort routines acting on the isolated dataset
  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((room) =>
        Object.values(room)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
    
      if (sortField === "floor") {
        const numA = Number(aVal);
        const numB = Number(bVal);
        if (!isNaN(numA) && !isNaN(numB)) {
          aVal = numA;
          bVal = numB;
        }
      }

      if (aVal === bVal) return 0;
      
      const multiplier = sortDirection === "asc" ? 1 : -1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * multiplier;
      }
      
      return (aVal > bVal ? 1 : -1) * multiplier;
    });

    return result;
  }, [rooms, search, sortField, sortDirection]);

  if (loading && projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        Loading project lists...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">Space Inventory</h1>
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">No projects found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Please upload an Excel workbook first to instantiate an isolated project workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selector Bar */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Space Inventory</h1>
          <p className="text-gray-500 text-sm">View and filter room data by project workbook.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label htmlFor="project-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-64 p-2.5"
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Main Table Content Container */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Search inventory (e.g. Building, Dept, Room name)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-sm text-gray-500">
            Showing {filteredRooms.length} records
          </span>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 select-none">
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("building")}
                >
                  Building{getSortIndicator("building")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("floor")}
                >
                  Floor{getSortIndicator("floor")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("room_number")}
                >
                  Room #{getSortIndicator("room_number")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("room_name")}
                >
                  Room Name{getSortIndicator("room_name")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("department")}
                >
                  Department{getSortIndicator("department")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("area")}
                >
                  Area (sq ft){getSortIndicator("area")}
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort("shared")}
                >
                  Shared{getSortIndicator("shared")}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    Loading records...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No matching records found for this workspace.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-900">{room.building}</td>
                    <td className="p-3 text-gray-600">{formatFloor(room.floor)}</td>
                    <td className="p-3 text-gray-600">{room.room_number || "—"}</td>
                    <td className="p-3 text-gray-700">{room.room_name || "—"}</td>
                    <td className="p-3 text-gray-600">{room.department}</td>
                    <td className="p-3 font-mono text-gray-900">
                      {Math.round(room.area).toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-500">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        room.shared === "Y" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                      }`}>
                        {room.shared}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}