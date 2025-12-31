// src/components/MenuItem.jsx
import React from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

export default function MenuItem({ route, hash, onNavigate, isOpen, onToggle }) {
  const submenuItems = route.submenu || [];
  const hasDropdown = submenuItems.length > 1;
  const activeSub = submenuItems.find(item => hash === item.path);
  const isActive = hash === route.path || !!activeSub;

  const handleClick = (e) => {
    if (hasDropdown) {
      e.preventDefault();
      onToggle();
    } else {
      const targetPath = submenuItems.length === 1 ? submenuItems[0].path : route.path;
      window.location.hash = targetPath;
      onNavigate();
    }
  };

  const handleSubmenuClick = (subPath) => {
    window.location.hash = subPath;
    onNavigate();
  };

  return (
    <div className="menu-item">
      <a
        href={route.path}
        className={`nav-link ${isActive ? 'active' : ''} ${hasDropdown ? 'has-submenu' : ''}`}
        onClick={handleClick}
      >
        <span className="nav-icon" style={{ marginRight: '0.5rem', fontSize: '1.3rem' }}>
          {route.icon}
        </span>
        <span className="nav-label" style={{ flex: 1 }}>
          {route.label}
        </span>
        {hasDropdown && (
          <span className="nav-arrow">
            {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </span>
        )}
      </a>
      
      {hasDropdown && isOpen && (
        <div className="submenu">
          {submenuItems.map((subItem, index) => (
            <a
              key={index}
              href={subItem.path}
              className={`submenu-link ${hash === subItem.path ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleSubmenuClick(subItem.path);
              }}
            >
              {subItem.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}