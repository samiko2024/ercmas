import Sidebar from "../components/Sidebar";
import CreateUserForm from "../components/CreateUserForm";
import UsersTable from "../components/UsersTable";
import "../styles/admin.css";

export default function AdminDashboard() {
  return (
    <div className="page-container">

      <div className="main-content">
        <div className="page-title">Admin Dashboard</div>

        <CreateUserForm />
        <UsersTable />
      </div>

    </div>
  );
}