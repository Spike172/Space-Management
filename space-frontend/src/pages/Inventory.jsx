import { useEffect, useState } from "react";
import api from "../api/apiClient";

export default function Inventory() {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    api.get("/spaces")
      .then((res) => setSpaces(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Space Inventory
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Building</th>
              <th className="p-2 text-left">Floor</th>
              <th className="p-2 text-left">Room</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Area</th>
            </tr>
          </thead>

          <tbody>
            {spaces.map((space, i) => (
              <tr
                key={i}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-2">{space.building}</td>
                <td className="p-2">{space.floor}</td>
                <td className="p-2">{space.room_name}</td>
                <td className="p-2">{space.department}</td>
                <td className="p-2">
                  {space.area?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}