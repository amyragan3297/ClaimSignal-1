import { Link, useLocation } from "wouter";
import { Shield, Search, LayoutDashboard, FileText, Menu, Bot } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logoImage from '@assets/generated_images/modern_geometric_logo_for_claimsignal.png';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

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

      <nav className="flex-1 p-4 space-y-2">
        <Link href="/">
          <Button variant={location === "/" ? "secondary" : "ghost"} className="w-full justify-start gap-3">
            <Search className="w-4 h-4" />
            Adjuster Search
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground opacity-50" disabled>
          <Bot className="w-4 h-4" />
          Tactical Advisor (Phase 2)
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground opacity-50" disabled>
          <LayoutDashboard className="w-4 h-4" />
          Analytics (Phase 2)
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground opacity-50" disabled>
          <FileText className="w-4 h-4" />
          Reports (Phase 2)
        </Button>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-primary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-mono">SYSTEM STATUS: ONLINE</p>
          <p className="text-xs text-emerald-500 font-mono mt-1">SECURE CONNECTION</p>
        </div>
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
            <span className="font-bold">CLAIM SIGNAL</span>
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
