import React from "react";
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
import { Link, Outlet, useNavigate } from "react-router-dom";
import StreamDialog from "./StreamDialog";
import { Slide, ToastContainer } from "react-toastify";
import useUserStore from "@/store/userStore";
import { Button } from "./ui/button";

const AppSidebar = () => {
  const coins = useUserStore((state) => state.coins);
  const role = useUserStore((state) => state.role);

  const navigate = useNavigate();

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
                      <span className="font-semibold">User Panel</span>
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
                  <Link
                    to="/"
                    className="!text-[--color-primary] !hover:bg-[--color-primary] !hover:text-white transition-colors rounded-md px-3 py-2"
                  >
                    <TvMinimalPlay />
                    View All Streams
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/admin"
                      className="!text-[--color-primary] !hover:bg-[--color-primary] !hover:text-white transition-colors rounded-md px-3 py-2"
                    >
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
