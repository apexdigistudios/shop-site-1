import { Outlet } from "react-router-dom";
import AdminGuard from "../../components/AdminGuard";

export default function AdminLayout() {
  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        <Outlet />
      </div>
    </AdminGuard>
  );
}
