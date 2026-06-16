import { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AdminHeader({ sidebarCollapsed }: AdminHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    }
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  return (
    <header
      className={styles.header}
      style={{
        left: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
    >
      <div className={styles.actions}>
        <div className={styles.notificationWrapper} ref={notificationRef}>
          <button
            className={styles.iconBtn}
            aria-label="Notifications"
            onClick={() => setNotificationOpen((prev) => !prev)}
          >
            <Bell size={20} />
          </button>

          {notificationOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>Notifications</div>
              <div className={styles.notificationEmpty}>No new notifications</div>
              <button
                className={styles.notificationLink}
                onClick={() => {
                  setNotificationOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={14} />
                Notification Preferences
              </button>
            </div>
          )}
        </div>

        <div className={styles.userMenu}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'Admin User'}</span>
            <span className={styles.userRole}>{user ? formatRole(user.role) : 'Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
