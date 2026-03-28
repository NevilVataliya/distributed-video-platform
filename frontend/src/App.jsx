import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useContext } from "react";
import FeedPage from "./pages/FeedPage";
import UploadPage from "./pages/UploadPage";
import WatchPage from "./pages/WatchPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

import "./App.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>🎬 StreamHub</h2>

      <div>
        <Link to="/" style={styles.link}>Home</Link>
        {user ? (
          <>
            <Link to="/upload" style={styles.link}>Upload</Link>
            <span style={{ marginLeft: "20px", color: "var(--accent)", fontWeight: 500 }}>{user.username}</span>
            <button onClick={logout} style={{ ...styles.link, background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* 🔹 Navbar */}
        <Navbar />

        {/* 🔹 Routes */}
        <Routes>

        {/* 🏠 HOME PAGE (Hero + Feed) */}
        <Route
          path="/"
          element={
            <>
              {/* 🔥 Keep your hero section */}
              <section id="center">
                <div className="hero">
                  <img src={heroImg} className="base" width="170" height="179" alt="" />
                  <img src={reactLogo} className="framework" alt="React logo" />
                  <img src={viteLogo} className="vite" alt="Vite logo" />
                </div>

                <div>
                  <h1>Welcome to StreamHub 🎥</h1>
                  <p>Upload and watch videos easily</p>
                </div>
              </section>

              {/* 🔥 Feed below hero */}
              <FeedPage />
            </>
          }
        />

        {/* Upload Page */}
        <Route path="/upload" element={<UploadPage />} />

        {/* Watch Page */}
        <Route path="/watch/:videoId" element={<WatchPage />} />

        {/* Auth Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 30px",
    background: "#111",
    color: "#fff",
  },
  logo: {
    margin: 0,
  },
  link: {
    marginLeft: "20px",
    color: "#fff",
    textDecoration: "none",
  },
};