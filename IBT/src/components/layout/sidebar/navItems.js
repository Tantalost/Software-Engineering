import {
  Home,
  Ticket,
  CircleParking,
  Store,
  SearchCheck,
  FileText,
  Bus,
  Settings,
} from "lucide-react";

export const menuItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/buses-trips", icon: Bus, label: "Buses" },
  { path: "/tickets", icon: Ticket, label: "Tickets" },
  { path: "/tenant-lease", icon: Store, label: "Tenants/Lease" },
  { path: "/parking", icon: CircleParking, label: "Parking" },
  { path: "/lost-found", icon: SearchCheck, label: "Lost and Found" },
  { path: "/reports", icon: FileText, label: "Reports" },
];

export const bottomMenuItems = [
  { path: "/settings", icon: Settings, label: "Settings" },
];