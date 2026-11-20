
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Cashier from "./pages/Cashier";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Employees from "./pages/Employees";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";

import { getCurrentUser, logout } from "./services/authService";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [activePage, setActivePage] = useState(
    getCurrentUser()?.role === "staff" ? "cashier" : "dashboard"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogin(loggedUser: User) {
    setUser(loggedUser);
    setActivePage(loggedUser.role === "staff" ? "cashier" : "dashboard");
  }

  function handleLogout() {
    logout();
    setUser(null);
    setActivePage("dashboard");
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentUser = user;

  function handleNavigate(page: string) {
    if (currentUser.role === "staff") {
      const allowedPages = ["cashier", "transactions"];

      if (!allowedPages.includes(page)) {
        setActivePage("cashier");
        return;
      }
    }

    setActivePage(page);
    setSidebarOpen(false);
  }

  const pageProps = {
    onMenuClick: () => setSidebarOpen(true),
  };

  function renderPage() {
    if (currentUser.role === "staff") {
      return activePage === "transactions"
        ? <Transactions {...pageProps} />
        : <Cashier {...pageProps} />;
    }

    switch (activePage) {
      case "cashier":
        return <Cashier {...pageProps} />;
      case "products":
        return <Products {...pageProps} />;
      case "categories":
        return <Categories {...pageProps} />;
      case "employees":
        return <Employees {...pageProps} />;
      case "transactions":
        return <Transactions {...pageProps} />;
      case "reports":
        return <Reports {...pageProps} />;
      default:
        return (
          <AdminDashboard
            onNavigate={handleNavigate}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userName={currentUser.name}
        userRole={currentUser.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        {renderPage()}
      </div>
    </div>
  );
}
