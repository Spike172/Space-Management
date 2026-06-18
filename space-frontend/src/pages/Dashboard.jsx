import { useEffect, useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../api/apiClient";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. On component mount, load the list of projects
  useEffect(() => {
    loadProjects();
  }, []);

  // 2. Whenever the selected project changes, load its dashboard stats
  useEffect(() => {
    if (selectedProjectId) {
      loadDashboard(selectedProjectId);
    } else {
      setStats(null);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Assumes you create a backend route: GET /projects
      const res = await api.get("/projects"); 
      setProjects(res.data);
      
      // Auto-select the first project if available
      if (res.data.length > 0) {
        setSelectedProjectId(res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setLoading(false);
    }
  };

  const loadDashboard = async (projectId) => {
    try {
      setLoading(true);
      // Assumes you update backend to accept project_id query parameter
      const res = await api.get(`/dashboard?project_id=${projectId}`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        Loading dashboard...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">No projects found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Go to the Upload page to create your first project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selector Header */}
      <div className="bg-white p-6 rounded-2xl shadow flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        
        <div className="flex items-center gap-3">
          <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5"
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!stats || stats.total_rooms === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-md">
          <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <p className="text-gray-500">This project has no space data.</p>
            <p className="text-sm text-gray-400 mt-2">
              Upload a file to populate this project's inventory.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500 text-sm">Total Area</p>
              <h2 className="text-3xl font-bold">
                {Math.round(stats.area).toLocaleString()}
              </h2>
              <p className="text-gray-500">sq ft</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500 text-sm">Rooms</p>
              <h2 className="text-3xl font-bold">
                {stats.total_rooms.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500 text-sm">Departments</p>
              <h2 className="text-3xl font-bold">
                {stats.total_departments.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <p className="text-gray-500 text-sm">Buildings</p>
              <h2 className="text-3xl font-bold">
                {stats.total_buildings.toLocaleString()}
              </h2>
            </div>
          </div>

          {/* Top Departments */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Top Departments by Area</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Department</th>
                  <th className="text-right p-2">Area</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_departments.map((dept) => (
                  <tr key={dept.name} className="border-b">
                    <td className="p-2">{dept.name}</td>
                    <td className="p-2 text-right">
                      {Math.round(dept.value).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Buildings */}
          {stats.buildings.length > 1 ? (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-4">Area by Building</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.buildings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6B7280" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-xl font-semibold mb-2">Building Summary</h2>
              <p className="text-gray-500">Uploaded inventory contains one building:</p>
              <p className="text-2xl font-bold mt-2">{stats.buildings[0]?.name}</p>
              <p className="text-gray-600">
                {Math.round(stats.buildings[0]?.value || 0).toLocaleString()} sq ft
              </p>
            </div>
          )}

          {/* Floors */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Area by Floor</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.floors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4B5563" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Largest Rooms */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Largest Rooms</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Room</th>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-left">Floor</th>
                  <th className="p-2 text-right">Area</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_rooms.map((room, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{room.room_name}</td>
                    <td className="p-2">{room.department}</td>
                    <td className="p-2">{room.floor}</td>
                    <td className="p-2 text-right">
                      {Math.round(room.area).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}