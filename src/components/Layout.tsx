import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserRound,
  LogOut,
  ShieldCheck,
  Server,
  Building2,
  LifeBuoy,
  Menu,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Users", icon: UserRound, end: false },
  { to: "/developers", label: "Developers", icon: Users, end: false },
  { to: "/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/first-party", label: "First-party", icon: Server, end: false },
  { to: "/customers", label: "Customers", icon: Building2, end: false },
  { to: "/tickets", label: "Tickets", icon: LifeBuoy, end: false },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
  badge,
}: typeof NAV[number] & { onClick?: () => void; badge?: number }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}>
      {({ isActive }) => (
        <div
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
            isActive ? "text-white" : "text-slate-400 hover:text-white"
          )}
        >
          {isActive && (
            <motion.div
              layoutId="nav-active"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/25"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <Icon className="relative z-10 h-[18px] w-[18px]" />
          <span className="relative z-10">{label}</span>
          {typeof badge === "number" && badge > 0 && (
            <span className="relative z-10 ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  // Live open-ticket count for the nav badge. Poll so admins see new tickets without a reload.
  const { data: ticketSummary } = useQuery({
    queryKey: ["admin-tickets-summary"],
    queryFn: async () => (await api.get("/admin/tickets/summary")).data as { open_count: number },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const openTickets = ticketSummary?.open_count ?? 0;

  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Valyd IdP Admin</div>
          <div className="text-[11px] text-slate-500">Identity &amp; Developers</div>
        </div>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1.5">
        {NAV.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            onClick={onNavigate}
            badge={item.to === "/tickets" ? openTickets : undefined}
          />
        ))}
      </nav>

      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-500">
        Signed-in admins can view and manage every developer and project in the portal.
      </div>
    </div>
  );
}

function AdminMenu() {
  const { admin, logout } = useAuth();
  const name = admin?.name || admin?.email || "Admin";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 outline-none transition-colors hover:bg-muted">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-xs font-semibold text-white">
          {initials(name)}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-sm font-medium leading-tight">{name}</div>
          <div className="text-[11px] capitalize leading-tight text-muted-foreground">{admin?.role}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{admin?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Always close the mobile drawer on navigation. Belt-and-braces with the onNavigate handler:
  // even a programmatic route change (redirect, back button) can never strand an open drawer.
  useEffect(() => {
    setMobileOpen(false);
    // Start every page at the top — otherwise a long list leaves the next page scrolled down.
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 p-4 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer.
          The backdrop is ALWAYS rendered and toggled purely with CSS — when closed it is
          `pointer-events-none opacity-0`, so it can never swallow taps across the app (an earlier
          AnimatePresence-exit version left an invisible, still-interactive overlay mounted, which
          froze every click and made search/nav look dead). The drawer itself just slides on a CSS
          transform, so there is no exiting-node lifecycle to get stuck. */}
      <div
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 p-4 transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute right-3 top-3 text-slate-400 hover:text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <AdminMenu />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
