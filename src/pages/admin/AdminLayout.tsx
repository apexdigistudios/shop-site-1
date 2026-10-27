import { Outlet } from "react-router-dom";
import AdminGuard from "../../components/AdminGuard";
import MobileNavbar from "../../components/MobileNavbar";

export default function AdminLayout() {
  return (
    <AdminGuard>
      <div className="admin-content mx-auto w-full max-w-7xl px-5 py-10 pb-28 sm:px-8 lg:pb-10">
        <Outlet />
      </div>
      <MobileNavbar />
    </AdminGuard>
  );
}
