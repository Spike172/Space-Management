// src/pages/Inventory.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";

export default function Inventory() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("building");
  const [sortDirection, setSortDirection] = useState("asc");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);

      const res = await api.get("/spaces");

      setRooms(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

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
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
    
      if (sortField === "area") {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
    
      if (
        typeof aVal === "number" &&
        !Number.isNaN(aVal)
      ) {
        return sortDirection === "asc"
          ? aVal - bVal
          : bVal - aVal;
      }
    
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [
    rooms,
    search,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(
        sortDirection === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return "";
  
    return sortDirection === "asc"
      ? " ▲"
      : " ▼";
  };

  const formatFloor = (floor) => {
    if (
      floor === null ||
      floor === undefined ||
      floor === ""
    ) {
      return "-";
    }
  
    const num = Number(floor);
  
    if (!Number.isNaN(num)) {
      return Number.isInteger(num)
        ? num.toString()
        : num;
    }
  
    return floor;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Space Inventory
        </h2>
        <p className="text-gray-500">
          Loading inventory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold mb-4">Space Inventory</h2>

        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold mb-4">
          Space Inventory
        </h2>

        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No inventory data available.
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Upload an Excel file to populate the inventory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-semibold">
          Space Inventory
        </h2>

        <p className="text-gray-500 mt-1">
          {filteredRooms.length.toLocaleString()} rooms displayed
        </p>
      </div>

      {/* Filters */}

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-lg px-4 py-2"
          />

        </div>
      </div>

      {/* Table */}

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("building")
                  }
                >
                  Building{getSortIndicator("building")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("floor")
                  }
                >
                  Floor{getSortIndicator("floor")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("room_number")
                  }
                >
                  Room #{getSortIndicator("room_number")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("room_name")
                  }
                >
                  Room Name{getSortIndicator("room_name")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("department")
                  }
                >
                  Department{getSortIndicator("department")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() =>
                    handleSort("area")
                  }
                >
                  Area (sq ft){getSortIndicator("area")}
                </th>

                <th
                  className="p-3 text-left cursor-pointer"
                  onClick={() => handleSort("shared")}
                >
                  Shared{getSortIndicator("shared")}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRooms.map((room, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{room.building}</td>
                  <td className="p-3">{formatFloor(room.floor)}</td>
                  <td className="p-3">{room.room_number}</td>
                  <td className="p-3">{room.room_name}</td>
                  <td className="p-3">{room.department}</td>

                  <td className="p-3">
                    {Math.round(
                      room.area
                    ).toLocaleString()}
                  </td>

                  <td className="p-3">{room.shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}