import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Mail,
  Database,
  MessageSquare,
  Users,
  StickyNote,
  Settings,
  Sparkles,
  BookOpen,
  Briefcase,
  Monitor,
  FileText,
  X,
  Pen,
  MessageCircle,
  Newspaper,
  Calculator,
  BarChart3,
  UserCog,
  FolderKanban,
  Calendar,
  Clock,
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }, []);

  const allNavItems = [
    { path: '/admin/about', icon: BookOpen, label: 'About', permission: 'canManageAbout' },
    { path: '/admin/portfolio', icon: Briefcase, label: 'Portfolio', permission: 'canManagePortfolio' },
    { path: '/admin/blogs', icon: Pen, label: 'Blogs', permission: 'canManageBlogs' },
    { path: '/admin/testimonials', icon: MessageCircle, label: 'Testimonials', permission: 'canManageTestimonials' },
    { path: '/admin/demos', icon: Monitor, label: 'Demos', permission: 'canManageDemos' },
    { path: '/admin/contacts', icon: Mail, label: 'Contacts', permission: 'canViewContacts' },
    { path: '/admin/contact-page', icon: FileText, label: 'Contact Page', permission: 'canManageContactPage' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings', permission: 'canManageBookings' },
    { path: '/admin/booking-settings', icon: Clock, label: 'Booking Settings', permission: 'canManageBookingSettings' },
    { path: '/admin/newsletter', icon: Newspaper, label: 'Newsletter', permission: 'canManageNewsletter' },
    { path: '/admin/pricing', icon: Calculator, label: 'Pricing Calculator', permission: 'canManagePricing' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'canViewAnalytics' },
    { path: '/admin/clients', icon: UserCog, label: 'Clients', permission: 'canManageClients' },
    { path: '/admin/client-projects', icon: FolderKanban, label: 'Client Projects', permission: 'canManageClientProjects' },
    { path: '/admin/storage', icon: Database, label: 'Storage', permission: 'canAccessStorage' },
    { path: '/admin/chat', icon: MessageSquare, label: 'Chat', permission: 'canManageChat' },
    { path: '/admin/notes', icon: StickyNote, label: 'Notes', permission: 'canManageNotes' },
    { path: '/admin/admins', icon: Users, label: 'Admins', permission: 'canManageAdmins' },
    { path: '/admin/settings', icon: Settings, label: 'Settings', permission: 'canManageSettings' },
    { path: '/admin/security', icon: ShieldCheck, label: 'Security Center', permission: 'canManageSettings' },
  ];

  // Filter navigation items based on user permissions
  const navItems = useMemo(() => {
    if (!currentUser) return [];
    
    // Super admin can see everything
    if (currentUser.role === 'super_admin') {
      return allNavItems;
    }
    
    // Regular admin - filter based on permissions
    const permissions = currentUser.permissions || {};
    return allNavItems.filter(item => {
      // If no permission requirement, show it
      if (!item.permission) return true;
      // Check if user has the required permission
      return permissions[item.permission] === true;
    });
  }, [currentUser]);

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={onClose}
        />
      )}
      
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <a href="/admin/contacts" className="admin-logo">
            <div className="admin-logo-icon">
              <Sparkles size={24} />
            </div>
            <span>METECHQ</span>
          </a>
          
          {/* Mobile Close Button */}
          <button 
            className="admin-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={handleNavClick}
            >
              <item.icon className="admin-nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
