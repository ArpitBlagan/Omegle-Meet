import "./App.css";
import Navbar from "./sections/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./sections/Footer";
import First from "./page/First";
import Signup from "./page/Signup";
import Signin from "./page/Signin";
import Random from "./page/Random";
import CreateRoom from "@/page/CreateRoom";
import Meet from "./page/Meet";
import { Toaster } from "react-hot-toast";
import Contexxt from "./Contexxt";
function App() {
  return (
    <Router>
      <Contexxt>
        <Toaster />
        <Navbar />
        <Routes>
          <Route path="/" element={<First />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          {/* <Route path="/calling" element={<Call />} /> */}
          <Route path="/random" element={<Random />} />
          <Route path="/room" element={<CreateRoom />} />
          <Route path="/room/:roomId" element={<Meet />} />
        </Routes>
        <Footer />
      </Contexxt>
    </Router>
  );
}

export default App;
