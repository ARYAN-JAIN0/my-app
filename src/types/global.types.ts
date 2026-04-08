// Common types used across the application

// Base entity interface
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export type UserRole = "admin" | "manager" | "user" | "viewer";

export interface User extends Entity {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLoginAt?: string;
}

// Timestamp helpers
export type DateRange = {
  start: string;
  end: string;
};

// Filter options
export interface FilterOptions {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Action result
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Select option for dropdowns
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Navigation item
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

// Dashboard metrics
export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

// Toast notification
export interface Toast {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
}
