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
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setStats(res.data);
      console.log(res.data);
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

  if (stats.total_rooms === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4">
          Dashboard
        </h2>
  
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No space data has been uploaded yet.
          </p>
  
          <p className="text-sm text-gray-400 mt-2">
            Upload a Bluebeam or Excel file to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <h2 className="text-xl font-semibold mb-4">
          Top Departments by Area
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">
                Department
              </th>

              <th className="text-right p-2">
                Area
              </th>
            </tr>
          </thead>

          <tbody>
            {stats.top_departments.map((dept) => (
              <tr
                key={dept.name}
                className="border-b"
              >
                <td className="p-2">
                  {dept.name}
                </td>

                <td className="p-2 text-right">
                  {Math.round(
                    dept.value
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Largest Rooms */}

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Largest Rooms
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">
                Room
              </th>

              <th className="p-2 text-left">
                Department
              </th>

              <th className="p-2 text-left">
                Floor
              </th>

              <th className="p-2 text-right">
                Area
              </th>
            </tr>
          </thead>

          <tbody>
            {stats.top_rooms.map((room, idx) => (
              <tr
                key={idx}
                className="border-b"
              >
                <td className="p-2">
                  {room.room_name}
                </td>

                <td className="p-2">
                  {room.department}
                </td>

                <td className="p-2">
                  {room.floor}
                </td>

                <td className="p-2 text-right">
                  {Math.round(
                    room.area
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}