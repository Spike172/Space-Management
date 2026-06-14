import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow">
      <h1 className="text-3xl font-bold mb-6">
        Login
      </h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg px-4 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-4 py-2"
        />

        <button
          className="w-full bg-gray-900 text-white py-2 rounded-lg"
        >
          Login
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-blue-600"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
