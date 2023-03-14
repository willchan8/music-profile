import { useState } from "react";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";

const inter = Inter({ subsets: ["latin"] });

export default function Login() {
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Send login request to server to get JWT token
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const { token } = await response.json();

      // Store the token in local storage
      localStorage.setItem("token", token);

      // Redirect to dashboard page
      window.location.replace("/dashboard");
    } else {
      console.error("Login failed.");
    }
  };

  return (
    <main className={styles.main}>
      <form onSubmit={handleSubmit}>
        <label className={inter.className}>
          Email:
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className={inter.className}>
          Password:
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
