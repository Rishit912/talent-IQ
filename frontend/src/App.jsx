
import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
// Use correct casing to match file system name in build
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import HostDashboard from "./pages/HostDashboard";
import Footer from "./components/Footer";

function App() {
  const { isSignedIn, isLoaded } = useUser();

  // this will get rid of the flickering effect
  if (!isLoaded) return null;

  return (
    <>
      {/* Desktop / tablet experience */}
      <div className="hidden md:block min-h-screen bg-base-100">
        <Routes>
          <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
          <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"} />} />

          <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />} />
          <Route path="/problem/:id" element={isSignedIn ? <ProblemPage /> : <Navigate to={"/"} />} />
          <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />} />
          <Route path="/host" element={isSignedIn ? <HostDashboard /> : <Navigate to={'/'} />} />
        </Routes>

        <Toaster toastOptions={{ duration: 3000 }} />

        <Footer />
      </div>

      {/* Mobile-only notice */}
      <div className="flex md:hidden min-h-screen bg-base-200 items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-bold text-base-content">Desktop Only</h1>
          <p className="text-base-content/70 text-sm">
            Talent-IQ is optimized for desktop and laptop screens.
            Please open this link on a larger device to take your interview.
          </p>
        </div>
      </div>
    </>
  );
}

export default App;
