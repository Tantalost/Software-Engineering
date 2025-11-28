import {
  Home,
  Ticket,
  CircleParking,
  Store,
  SearchCheck,
  FileText,
  Bus,
  Users,
  AlertTriangle,
} from "lucide-react";

export const menuItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard", roles: ["superadmin"] },
  { path: "/buses-trips", icon: Bus, label: "Buses", roles: ["bus","superadmin"] },
  { path: "/tickets", icon: Ticket, label: "Tickets", roles: ["ticket","superadmin"] },
  { path: "/tenant-lease", icon: Store, label: "Tenants/Lease", roles: ["lease","superadmin"] },
  { path: "/parking", icon: CircleParking, label: "Parking", roles: ["superadmin", "parking"] },
  { path: "/lost-found", icon: SearchCheck, label: "Lost and Found", roles: ["lostfound","superadmin"] },
  { path: "/reports", icon: FileText, label: "Reports", roles: ["superadmin"] },
  { path: "/deletion-requests", icon: AlertTriangle, label: "Deletion Requests", roles: ["superadmin"] },
  { path: "/employee-management", icon: Users, label: "Manage Employees", roles: ["superadmin"] },
   
];

export const bottomMenuItems = [];