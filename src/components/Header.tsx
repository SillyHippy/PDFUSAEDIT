
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LogOut, 
  Home, 
  Users, 
  History, 
  FileText, 
  Menu, 
  X, 
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("serve-tracker-auth");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
      variant: "default"
    });
    navigate('/login');
  };

  const mobileNavLink = ({ isActive }: { isActive: boolean }) => 
    cn(
      "flex items-center gap-2 py-3 px-4 rounded-md transition-colors w-full",
      isActive 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );
  
  const desktopNavLink = ({ isActive }: { isActive: boolean }) => 
    cn(
      "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
      isActive ? "text-foreground" : "text-muted-foreground"
    );

  // Mobile menu content
  const mobileMenu = (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[75vw] max-w-[300px] p-0">
        <div className="flex flex-col h-full">
          <div className="border-b p-4 flex items-center justify-between">
            <Link to="/dashboard" className="font-bold text-lg" onClick={() => setIsMenuOpen(false)}>
              ServeTracker
            </Link>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <NavLink to="/dashboard" className={mobileNavLink} onClick={() => setIsMenuOpen(false)}>
              <Home className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={mobileNavLink} onClick={() => setIsMenuOpen(false)}>
              <Users className="h-5 w-5" />
              Clients
            </NavLink>
            <NavLink to="/history" className={mobileNavLink} onClick={() => setIsMenuOpen(false)}>
              <History className="h-5 w-5" />
              History
            </NavLink>
            <NavLink to="/export" className={mobileNavLink} onClick={() => setIsMenuOpen(false)}>
              <FileText className="h-5 w-5" />
              Export
            </NavLink>
          </nav>
          <div className="border-t p-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start" 
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4">
        {isMobile ? (
          <>
            {mobileMenu}
            <div className="flex-1 flex justify-center">
              <Link to="/dashboard" className="font-bold text-lg">
                ServeTracker
              </Link>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/new-serve')}
              className="flex items-center rounded-full"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">New Serve</span>
            </Button>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="flex items-center font-bold mr-6">
              ServeTracker
            </Link>
            <nav className="flex flex-1 items-center space-x-4">
              <NavLink
                to="/dashboard"
                className={desktopNavLink}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/clients"
                className={desktopNavLink}
              >
                <Users className="h-4 w-4" />
                Clients
              </NavLink>
              <NavLink
                to="/history"
                className={desktopNavLink}
              >
                <History className="h-4 w-4" />
                History
              </NavLink>
              <NavLink
                to="/export"
                className={desktopNavLink}
              >
                <FileText className="h-4 w-4" />
                Export
              </NavLink>
            </nav>
            <div className="ml-auto flex items-center space-x-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate('/new-serve')}
                className="flex items-center"
              >
                <span className="mr-1">+</span> New Serve
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
