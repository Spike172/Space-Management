import { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import api from "../api/apiClient";

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/spaces/summary").then((res) => setData(res.data));
  }, []);

  const colors = ["#9CA3AF", "#6B7280", "#4B5563", "#374151", "#1F2937"];

  return (
    <motion.div
      className="bg-white p-8 rounded-2xl shadow-md border border-gray-200"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Space Utilization Overview
      </h2>

      {data.length === 0 ? (
        <div className="text-gray-500 text-center p-8 border border-dashed border-gray-300 rounded-xl">
          📂 No data yet. Please upload an Excel file to see visualization.
        </div>
      ) : (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #D1D5DB",
                  borderRadius: "0.5rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}