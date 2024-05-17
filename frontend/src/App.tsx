import "./App.css";
import Navbar from "./sections/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./sections/Footer";
import First from "./page/First";
import Signup from "./page/Signup";
import Signin from "./page/Signin";
import Random from "./page/Random";
import Room from "./sections/Room";
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<First />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        {/* <Route path="/calling" element={<Call />} /> */}
        <Route path="/random" element={<Random />} />
        <Route path="/room" element={<Room />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
