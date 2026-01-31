import { Link, useLocation } from "wouter";
import { Shield, Search, LayoutDashboard, FileText, Menu, Bot, ClipboardList, Building2, LogOut, Users, Settings, FilePlus, BookOpen, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logoImage from '@assets/generated_images/modern_geometric_logo_for_claimsignal.png';
import { useAuth } from "@/lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { logout, userType, email, accessLevel } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-primary/10 p-1.5 rounded-md group-hover:bg-primary/20 transition-colors">
              <img src={logoImage} alt="ClaimSignal Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">CLAIM<span className="text-primary font-mono">SIGNAL</span></h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Confidential</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 font-medium">Primary</p>
        <Link href="/adjusters">
          <Button variant={location === "/adjusters" || location.startsWith("/adjuster/") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Search className="w-4 h-4" />
            Adjuster Intel
          </Button>
        </Link>
        <Link href="/carriers">
          <Button variant={location === "/carriers" || location.startsWith("/carrier/") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Building2 className="w-4 h-4" />
            Carrier Profiles
          </Button>
        </Link>
        <Link href="/tactical-advisor">
          <Button variant={location === "/tactical-advisor" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Bot className="w-4 h-4" />
            Tactics Library
          </Button>
        </Link>
        <Link href="/analytics">
          <Button variant={location === "/analytics" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 pt-4 font-medium">Claims</p>
        <Link href="/claims">
          <Button variant={location.startsWith("/claims") || location.startsWith("/claim/") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <ClipboardList className="w-4 h-4" />
            Claims
          </Button>
        </Link>
        <Link href="/supplements">
          <Button variant={location === "/supplements" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <FilePlus className="w-4 h-4" />
            Supplements
          </Button>
        </Link>
        <Link href="/case-studies">
          <Button variant={location === "/case-studies" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <BookOpen className="w-4 h-4" />
            Case Studies
          </Button>
        </Link>
        <Link href="/risk-alerts">
          <Button variant={location === "/risk-alerts" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <AlertTriangle className="w-4 h-4" />
            Risk Alerts
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant={location === "/reports" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <FileText className="w-4 h-4" />
            Reports
          </Button>
        </Link>

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 pt-4 font-medium">About</p>
        <Link href="/methodology">
          <Button variant={location === "/methodology" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Info className="w-4 h-4" />
            Methodology
          </Button>
        </Link>
        <Link href="/legal">
          <Button variant={location === "/legal" || location === "/terms" || location === "/privacy" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Shield className="w-4 h-4" />
            Legal
          </Button>
        </Link>

        {accessLevel === 'admin' && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 pt-4 font-medium">Admin</p>
            <Link href="/admin/team">
              <Button variant={location.startsWith("/admin") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                <Users className="w-4 h-4" />
                Team Management
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant={location === "/settings" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="bg-sidebar-primary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-mono">
            {userType === 'team' ? 'TEAM ACCESS' : email || 'INDIVIDUAL'}
          </p>
          <p className="text-xs font-mono mt-1">
            <span className={accessLevel === 'admin' ? 'text-amber-500' : accessLevel === 'editor' ? 'text-blue-500' : 'text-muted-foreground'}>
              {accessLevel?.toUpperCase() || 'VIEWER'}
            </span>
          </p>
          <p className="text-xs text-emerald-500 font-mono mt-1">SECURE CONNECTION</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background z-50 flex items-center px-4 justify-between">
         <div className="flex items-center gap-2">
            <img src={logoImage} alt="ClaimSignal Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold">CLAIM<span className="text-primary font-mono">SIGNAL</span></span>
         </div>
         <Sheet open={open} onOpenChange={setOpen}>
           <SheetTrigger asChild>
             <Button variant="ghost" size="icon">
               <Menu className="w-5 h-5" />
             </Button>
           </SheetTrigger>
           <SheetContent side="left" className="p-0 bg-sidebar border-r border-sidebar-border w-64">
             <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
             <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
             <NavContent />
           </SheetContent>
         </Sheet>
      </div>

      <main className="flex-1 md:h-screen md:overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
