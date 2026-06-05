import { useEffect, useState } from "react";
import api from "../api/apiClient";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const pieColors = [
  "#374151",
  "#4B5563",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
];

export default function Dashboard() {
  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [shared, setShared] = useState([]);
  const [topRooms, setTopRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          deptRes,
          buildingRes,
          floorRes,
          sharedRes,
          roomRes,
        ] = await Promise.all([
          api.get("/spaces/summary"),
          api.get("/spaces/buildings"),
          api.get("/spaces/floors"),
          api.get("/spaces/shared"),
          api.get("/spaces/toprooms"),
        ]);

        setDepartments(deptRes.data);
        setBuildings(buildingRes.data);
        setFloors(floorRes.data);
        setShared(sharedRes.data);
        setTopRooms(roomRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Space Management Dashboard
        </h2>

        <p className="text-gray-500 mt-2">
          Space utilization and inventory analytics.
        </p>
      </div>

      {/* Top Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Department Pie */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Department Utilization
          </h3>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departments}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {departments.map((_, i) => (
                    <Cell
                      key={i}
                      fill={pieColors[i % pieColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shared Space */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Shared vs Dedicated Space
          </h3>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shared}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {shared.map((_, i) => (
                    <Cell
                      key={i}
                      fill={pieColors[i % pieColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Building Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Building Utilization
        </h3>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildings}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                name="Area (Sq Ft)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Floor Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Floor Utilization
        </h3>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={floors}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="value"
                name="Area (Sq Ft)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Rooms Table */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Largest Rooms
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3">Room</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Building</th>
                <th className="text-left p-3">Floor</th>
                <th className="text-left p-3">Area</th>
              </tr>
            </thead>

            <tbody>
              {topRooms.slice(0, 10).map((room, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">
                    {room.room_name}
                  </td>

                  <td className="p-3">
                    {room.department}
                  </td>

                  <td className="p-3">
                    {room.building}
                  </td>

                  <td className="p-3">
                    {room.floor}
                  </td>

                  <td className="p-3">
                    {room.area?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}