import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/apiClient";

export default function RegisterC() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const res = await api.post("/register", {
        username,
        email,
        password,
      });

      setMessage("✅ Account created successfully");

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: res.data.user_id,
          username,
        })
      );

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error(err);

      setMessage(
        err?.response?.data?.detail ||
          "❌ Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-8">
      <h1 className="text-3xl font-bold mb-2">
        Create Account
      </h1>

      <p className="text-gray-500 mb-6">
        Register for Space Manager
      </p>

      <form
        onSubmit={handleRegister}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {loading
            ? "Creating Account..."
            : "Register"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center">
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-blue-600 hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}