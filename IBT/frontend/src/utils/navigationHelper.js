// src/utils/navigationHelper.js
import { useNavigate } from 'react-router-dom';

// Route mappings for different pages
export const PAGE_ROUTES = {
  'Lost & Found': '/lost-found',
  'Tenants': '/tenant-lease',
  'Parking': '/parking',
  'Terminal Fees': '/tickets',
  'Buses & Trips': '/buses-trips',
  'Reports': '/reports',
  'Deletion Requests': '/deletion-requests',
  'Employee Management': '/employee-management',
  'Archive': '/archive',
  'Dashboard': '/dashboard'
};

// Hook for navigation
export const useNavigationHelper = () => {
  const navigate = useNavigate();

  const navigateToPage = (source, customRoute = null) => {
    const route = customRoute || PAGE_ROUTES[source];
    if (route) {
      navigate(route);
    } else {
      console.warn(`No route found for source: ${source}`);
    }
  };

  return { navigateToPage };
};

// Utility function for direct navigation (outside of React components)
export const navigateToPage = (source, customRoute = null) => {
  const route = customRoute || PAGE_ROUTES[source];
  if (route) {
    window.location.href = route;
  } else {
    console.warn(`No route found for source: ${source}`);
  }
};
