import { createBrowserRouter } from "react-router";
import { GetStarted } from "./pages/GetStarted";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ProviderDashboard } from "./pages/provider/ProviderDashboard";
import { ProviderOverview } from "./pages/provider/ProviderOverview";
import { MyJobs } from "./pages/provider/MyJobs";
import { Promote } from "./pages/provider/Promote";
import { ProviderInbox } from "./pages/provider/ProviderInbox";
import { ProviderProfile } from "./pages/provider/ProviderProfile";
import { ServiceArea } from "./pages/provider/ServiceArea";
import { ProviderReviews } from "./pages/provider/ProviderReviews";
import { SeekerDashboard } from "./pages/seeker/SeekerDashboard";
import { SeekerOverview } from "./pages/seeker/SeekerOverview";
import { SeekerMap } from "./pages/seeker/SeekerMap";
import { SeekerInbox } from "./pages/seeker/SeekerInbox";
import { MyBookings } from "./pages/seeker/MyBookings";
import { SeekerReviews } from "./pages/seeker/SeekerReviews";
import { SeekerProfile } from "./pages/seeker/SeekerProfile";
import { BecomeSeller } from "./pages/seeker/BecomeSeller";
import { Feedback } from "./components/Feedback";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminJobs } from "./pages/admin/AdminJobs";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminFeedback } from "./pages/admin/AdminFeedback";

export const router = createBrowserRouter([
  { path: "/", element: <GetStarted /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    path: "/provider",
    element: <ProviderDashboard />,
    children: [
      { index: true, element: <ProviderOverview /> },
      { path: "jobs", element: <MyJobs /> },
      { path: "promote", element: <Promote /> },
      { path: "inbox", element: <ProviderInbox /> },
      { path: "profile", element: <ProviderProfile /> },
      { path: "service-area", element: <ServiceArea /> },
      { path: "reviews", element: <ProviderReviews /> },
      { path: "feedback", element: <Feedback /> },
    ],
  },
  {
    path: "/seeker",
    element: <SeekerDashboard />,
    children: [
      { index: true, element: <SeekerMap /> },
      { path: "overview", element: <SeekerOverview /> },
      { path: "map", element: <SeekerMap /> },
      { path: "inbox", element: <SeekerInbox /> },
      { path: "bookings", element: <MyBookings /> },
      { path: "reviews", element: <SeekerReviews /> },
      { path: "profile", element: <SeekerProfile /> },
      { path: "become-seller", element: <BecomeSeller /> },
      { path: "feedback", element: <Feedback /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: "users", element: <AdminUsers /> },
      { path: "jobs", element: <AdminJobs /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "categories", element: <AdminCategories /> },
      { path: "feedback", element: <AdminFeedback /> },
    ],
  },
]);
