import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AdminHeader } from './AdminHeader';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={sidebarCollapsed && !mobileOpen}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={() => setMobileOpen(false)}
      />
      {mobileOpen && <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />}
      <AdminHeader sidebarCollapsed={sidebarCollapsed} onMenuClick={() => setMobileOpen(true)} />
      <main className={styles.main} data-collapsed={sidebarCollapsed}>
        <Outlet />
      </main>
    </div>
  );
}
