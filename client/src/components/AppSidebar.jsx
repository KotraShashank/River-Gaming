import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import {
  BadgeDollarSign,
  DollarSign,
  LogOut,
  Settings,
  ShieldUser,
  TvMinimalPlay,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import StreamDialog from "./StreamDialog";
import { Slide, ToastContainer, toast } from "react-toastify";
import useUserStore from "@/store/userStore";
import { Button } from "./ui/button";
import axios from "axios";

const AppSidebar = () => {
  const coins = useUserStore((state) => state.coins);
  const role = useUserStore((state) => state.role);
  const name = useUserStore((state) => state.name);
  const setId = useUserStore((state) => state.setUserId);
  const setName = useUserStore((state) => state.setName);
  const setCoins = useUserStore((state) => state.setCoins);
  const setRole = useUserStore((state) => state.setRole);

  const navigate = useNavigate();
  const location = useLocation();

  // Runs once per app load (this layout wraps every authenticated route),
  // so admin/user info is always in sync no matter which page you land on.
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { id, name, coins, isFirst, role } = res.data.data;

        if (isFirst) {
          const firstRes = await axios.put(
            "/api/user/first",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Server only reports firstLogin once, so the message can't repeat.
          // The 50 coins are the starting balance already included above.
          if (firstRes.data?.data?.firstLogin) {
            toast.success("🎉 Welcome! Your account starts with 50 free coins!");
          }
        }

        setId(id);
        setName(name);
        setCoins(coins);
        setRole(role);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };

    loadUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navLinkClass = (path) =>
    `transition-colors rounded-md px-3 py-2 ${
      location.pathname === path
        ? "bg-[--color-primary] text-white"
        : "!text-[--color-primary] hover:bg-[--color-primary] hover:text-white"
    }`;

  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to={role === "admin" ? "/admin" : "/"}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {role === "admin" ? <Settings /> : <DollarSign />}
                  </div>
                  {role === "admin" ? (
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Admin Panel</span>
                      <span className="">V1</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">
                        {name ? `Hi, ${name.split(" ")[0]}` : "User Panel"}
                      </span>
                      <span className="">Watch streams, earn coins</span>
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className={navLinkClass("/")}>
                    <TvMinimalPlay />
                    View All Streams
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin" className={navLinkClass("/admin")}>
                      <ShieldUser />
                      Admin Panel
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex justify-center items-center">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="flex justify-center items-center gap-2 px-4 py-2 rounded-md text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-md mb-0.5">Logout</span>
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 flex justify-between h-16 shrink-0 items-center gap-2 border-b bg-background px-4 z-50">
          <SidebarTrigger />
          <div className="flex gap-2">
            {role === "admin" ? (
              <StreamDialog />
            ) : (
              <Button className={"font-semibold"}>
                <BadgeDollarSign /> {coins} Coins
              </Button>
            )}
            <ModeToggle />
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          limit={4}
          hideProgressBar={false}
          newestOnTop
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover
          theme="colored"
          transition={Slide}
        />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppSidebar;
