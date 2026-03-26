import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import UploadPage from "./pages/UploadPage";
import WatchPage from "./pages/WatchPage";

import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      {/* 🔹 Navbar */}
      <nav style={styles.nav}>
        <h2 style={styles.logo}>🎬 StreamHub</h2>

        <div>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/upload" style={styles.link}>Upload</Link>
        </div>
      </nav>

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

      </Routes>
    </BrowserRouter>
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