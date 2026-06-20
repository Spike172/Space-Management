// src/pages/Dashboard.jsx

import { useEffect, useState, useMemo } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../api/apiClient";

// Modern professional color palette for pie chart slices
const COLORS = [
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#4B5563", // Gray
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. On component mount, load the list of projects
  useEffect(() => {
    loadProjects();
  }, []);

  // 2. Whenever the selected project changes, load its dashboard statistics and space records
  useEffect(() => {
    if (selectedProjectId) {
      loadDashboardData(selectedProjectId);
    } else {
      setStats(null);
      setRooms([]);
      setSelectedBuilding("");
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects"); 
      setProjects(res.data || []);
      
      // Auto-select the first project if available
      if (res.data && res.data.length > 0) {
        setSelectedProjectId(res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setLoading(false);
    }
  };

  const loadDashboardData = async (projectId) => {
    try {
      setLoading(true);
      
      // Fetch both the general aggregated stats and raw items concurrently
      const [statsRes, spacesRes] = await Promise.all([
        api.get(`/dashboard?project_id=${projectId}`),
        api.get(`/spaces?project_id=${projectId}`)
      ]);

      setStats(statsRes.data);
      const roomsData = spacesRes.data || [];
      setRooms(roomsData);

      // Extract unique buildings and default the selection to the first building if found
      const bldgs = Array.from(new Set(roomsData.map((r) => r.building))).filter(Boolean).sort();
      if (bldgs.length > 0) {
        setSelectedBuilding(bldgs[0]); // Default to the first building to avoid initial jumbling
      } else {
        setSelectedBuilding("");
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique sorted building values for the dropdown filter
  const uniqueBuildings = useMemo(() => {
    const bldgs = Array.from(new Set(rooms.map((r) => r.building))).filter(Boolean);
    return bldgs.sort();
  }, [rooms]);

  // Dynamically compute the isolated floor dataset for the active building selection
  const floorChartData = useMemo(() => {
    const filteredRooms = selectedBuilding
      ? rooms.filter((r) => r.building === selectedBuilding)
      : rooms;

    const floorMap = {};
    filteredRooms.forEach((room) => {
      const floorName = room.floor || "Unknown";
      floorMap[floorName] = (floorMap[floorName] || 0) + (room.area || 0);
    });

    return Object.keys(floorMap)
      .map((floor) => ({
        name: floor,
        value: floorMap[floor],
      }))
      .sort((a, b) => {
        const numA = parseFloat(a.name);
        const numB = parseFloat(b.name);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [rooms, selectedBuilding]);

  if (loading && projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        Loading dashboard analytics...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">No active project environments found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Please go to the Upload section to instantiate an isolated project workspace.
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
          <h1 className="text-2xl font-bold">Workspace Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time macro space allocation metrics.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label htmlFor="project-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Active Project:
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

      {stats && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-sm text-gray-500 font-medium">Total Gross Area</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.round(stats.total_area || 0).toLocaleString()}{" "}
                <span className="text-sm font-normal text-gray-400">sq ft</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-sm text-gray-500 font-medium">Total Audited Rooms</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.total_rooms || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-sm text-gray-500 font-medium">Unique Departments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.total_departments || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-sm text-gray-500 font-medium">Total Buildings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.total_buildings || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Charts Allocation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area by Department */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Area by Department</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.top_departments || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} sq ft`} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area by Floor with Building Dropdown Filter */}
            <div className="bg-white p-6 rounded-2xl shadow flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-semibold">Area by Floor</h2>
                
                <div className="flex items-center gap-2">
                  <label htmlFor="building-select" className="text-xs font-medium text-gray-500 whitespace-nowrap">
                    Filter Building:
                  </label>
                  <select
                    id="building-select"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-medium"
                  >
                    <option value="">All Buildings Combined</option>
                    {uniqueBuildings.map((bldg) => (
                      <option key={bldg} value={bldg}>
                        {bldg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-64">
                {floorChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    No floor space dataset found for this building selection.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={floorChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} sq ft`} />
                      <Bar dataKey="value" fill="#4B5563" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Standalone Full-Width Area by Building Pie Chart Panel */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Area by Building Breakdown</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.buildings || []}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {(stats.buildings || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.round(value).toLocaleString()} sq ft`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Largest Rooms Table */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Largest Rooms</h2>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-left">
                    <th className="p-3">Building</th>
                    <th className="p-3">Room Name / Number</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Floor</th>
                    <th className="p-3 text-right">Area</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_rooms && stats.top_rooms.map((room, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-900">{room.building || "—"}</td>
                      <td className="p-3 text-gray-700">
                        {room.room_name} {room.room_number ? `(#${room.room_number})` : ""}
                      </td>
                      <td className="p-3 text-gray-600">{room.department}</td>
                      <td className="p-3 text-gray-600">{room.floor}</td>
                      <td className="p-3 text-right font-mono text-gray-900">
                        {Math.round(room.area).toLocaleString()} sq ft
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}