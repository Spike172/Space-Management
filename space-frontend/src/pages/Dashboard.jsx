import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../api/apiClient";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        Loading dashboard...
      </div>
    );
  }

  const colors = [
    "#9CA3AF",
    "#6B7280",
    "#4B5563",
    "#374151",
    "#1F2937",
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500 text-sm">Total Area</p>
          <h2 className="text-3xl font-bold">
            {Math.round(stats.total_area).toLocaleString()}
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

      {/* Department Pie */}

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Department Area Distribution
        </h2>

        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.top_departments}
                dataKey="value"
                nameKey="name"
                outerRadius={170}
              >
                {stats.top_departments.map((_, i) => (
                  <Cell
                    key={i}
                    fill={colors[i % colors.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Departments */}

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Top Departments by Area
        </h2>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.top_departments}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={140}
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#374151"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Buildings */}

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Area by Building
        </h2>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.buildings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Bar
                dataKey="value"
                fill="#6B7280"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Floors */}

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Area by Floor
        </h2>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.floors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Bar
                dataKey="value"
                fill="#4B5563"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}