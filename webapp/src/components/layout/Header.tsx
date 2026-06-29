import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, X, Settings, LogOut, User, BarChart3 } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

interface HeaderProps {
  variant?: 'landing' | 'dashboard' | 'wizard';
  title?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export function Header({ variant = 'landing', title, user }: HeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          {variant === 'landing' ? (
            <Link to="/" className={styles.logo}>
              <MynglyLogo />
            </Link>
          ) : (
            <button
              type="button"
              className={styles.logo}
              onClick={() => navigate('/dashboard')}
            >
              <MynglyLogo />
              {title && (
                <span className={variant === 'wizard' ? styles.wizardTitle : styles.title}>{title}</span>
              )}
            </button>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className={styles.right}>
          {variant === 'landing' && (
            <>
              <Link to="/auth/signin">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link to="/campaign/new">
                <Button variant="primary">Start a Campaign</Button>
              </Link>
            </>
          )}

          {(variant === 'dashboard' || variant === 'wizard') && user && (
            <>
              {variant === 'dashboard' && (
                <div className={styles.notificationWrapper} ref={notificationRef}>
                  <button
                    className={styles.notificationBtn}
                    onClick={() => setNotificationOpen(!notificationOpen)}
                  >
                    <Bell size={20} />
                  </button>
                  {notificationOpen && (
                    <div className={styles.notificationDropdown}>
                      <div className={styles.notificationHeader}>Notifications</div>
                      <div className={styles.notificationEmpty}>No new notifications</div>
                      <Link
                        to="/settings"
                        className={styles.notificationLink}
                        onClick={() => setNotificationOpen(false)}
                      >
                        Notification Preferences
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.userMenuWrapper} ref={userMenuRef}>
                <button
                  className={styles.userMenu}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className={styles.userName}>{user.name}</span>
                  <div className={styles.avatar}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <ChevronDown size={16} className={userMenuOpen ? styles.rotated : ''} />
                </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <Link to="/settings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <User size={16} />
                      Profile
                    </Link>
                    <Link to="/reports" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <BarChart3 size={16} />
                      Reports
                    </Link>
                    <Link to="/settings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            {variant === 'landing' && (
              <>
                <Link
                  to="/auth/signin"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/campaign/new"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start a Campaign
                </Link>
              </>
            )}

            {(variant === 'dashboard' || variant === 'wizard') && user && (
              <>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.avatar}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={styles.mobileUserName}>{user.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/campaign/new"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Campaign
                </Link>
                <Link
                  to="/settings"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className={styles.mobileNavLink}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MynglyLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#90DDF0" />
      <circle cx="20" cy="20" r="12" fill="#2C666E" />
      <circle cx="20" cy="20" r="6" fill="#90DDF0" />
    </svg>
  );
}
