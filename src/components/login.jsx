import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import RotatingCube from "./RotatingCube";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id); // Correct key for userId
        login(data.user); // Assuming this sets user context/state
        navigate("/lesgroupes");
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch (error) {}
  };

  return (
    <div className="flex h-screen lg:bg-black">
      <div className="flex-1 hidden lg:flex justify-center items-center w-1/2">
        <RotatingCube />
      </div>
      <div className="m-auto shadow-lg sm:w-full sm:p-0 w-full px-4 sm:mr-0 lg:mr-24">
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          Connexion
        </h1>
        {error && (
          <p className="bg-red-700 text-white text-center p-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              className="w-full px-4 py-2 text-sm text-gray-900 bg-white border-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              className="w-full px-4 py-2 text-sm text-gray-900 bg-white border-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex">
            <Link to="#" className="text-sm text-blue-300 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm font-medium"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-white">
          Pas encore membre ?{" "}
          <Link to="/register" className="text-blue-300 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
