import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import UserDashboard from "./pages/UserDashboard";
import ReportLostItem from "./pages/ReportLostItem";
import EditLostItem from "./pages/EditLostItem";
import EditFoundItem from "./pages/EditFoundItem";
import DeleteLostItem from "./pages/DeleteLostItem";
import ViewLostItems from "./pages/ViewLostItems";
import ReportFoundItems from "./pages/ReportFoundItems";
import ViewFoundItems from "./pages/ViewFoundItems";
import AIChatbot from "./pages/AIChatbot";
import AIMatches from "./pages/AIMatches";
import VerifyClaim from "./pages/VerifyClaim";
import ClaimSubmitted from "./pages/ClaimSubmitted";
import MyClaims from "./pages/MyClaims";
import AdminClaims from "./pages/AdminClaims";
import AdminUsers from "./pages/AdminUsers";
import CollectionDetails from "./pages/CollectionDetails";
import FinderDropoff from "./pages/FinderDropoff";
import AdminFoundIntake from "./pages/AdminFoundIntake";

const UserPage = ({ children }) => <><Navbar />{children}</>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/dashboard" element={<UserPage><UserDashboard /></UserPage>} />
        <Route path="/report-lost-item" element={<UserPage><ReportLostItem /></UserPage>} />
        <Route path="/edit-lost-item/:id" element={<UserPage><EditLostItem /></UserPage>} />
        <Route path="/delete-lost-item" element={<UserPage><DeleteLostItem /></UserPage>} />
        <Route path="/view-lost-items" element={<UserPage><ViewLostItems /></UserPage>} />
        <Route path="/report-found-item" element={<UserPage><ReportFoundItems /></UserPage>} />
        <Route path="/view-found-items" element={<UserPage><ViewFoundItems /></UserPage>} />
        <Route path="/ai-chatbot" element={<UserPage><AIChatbot /></UserPage>} />
        <Route path="/ai-matches" element={<UserPage><AIMatches /></UserPage>} />
        <Route path="/verify-claim" element={<UserPage><VerifyClaim /></UserPage>} />
        <Route path="/claim-submitted" element={<UserPage><ClaimSubmitted /></UserPage>} />
        <Route path="/my-claims" element={<UserPage><MyClaims /></UserPage>} />
        <Route path="/collection/:id" element={<UserPage><CollectionDetails /></UserPage>} />
        <Route path="/found-dropoff/:id" element={<UserPage><FinderDropoff /></UserPage>} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-found-intake" element={<AdminFoundIntake />} />
        <Route path="/admin-claims" element={<AdminClaims />} />
        <Route path="/admin-users" element={<AdminUsers />} />
        <Route path="/edit-found-item/:id" element={<EditFoundItem />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
