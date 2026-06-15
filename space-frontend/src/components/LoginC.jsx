import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/apiClient";

export default function LoginC() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const res = await api.post("/login", {
        username,
        password,
      });

      // Save JWT token
      localStorage.setItem(
        "token",
        res.data.access_token
      );

      // Save user info
      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: res.data.user_id,
          username: res.data.username,
        })
      );

      setMessage("✅ Login successful");

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error(err);

      setMessage(
        err?.response?.data?.detail ||
          "❌ Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-8">
      <h1 className="text-3xl font-bold mb-2">
        Login
      </h1>

      <p className="text-gray-500 mb-6">
        Sign into your account
      </p>

      <form
        onSubmit={handleLogin}
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
            ? "Signing In..."
            : "Login"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center">
          {message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Need an account?{" "}
        <Link
          to="/register"
          className="text-blue-600 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}