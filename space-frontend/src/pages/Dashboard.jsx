import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/spaces/summary").then((res) => setData(res.data));
  }, []);

  const colors = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4 font-semibold">Space Utilization</h2>
      {data.length === 0 ? (
        <p>No data yet. Please upload an Excel file.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}