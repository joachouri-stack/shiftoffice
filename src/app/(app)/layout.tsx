import { DesktopSidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-mist/40 min-h-dvh">
      <DesktopSidebar />
      <MobileNav />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
