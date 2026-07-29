import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/user";
import { AppShell } from "../../shell";

/**
 * Categories gets the shell and no zoom control, exactly like Habits — it's a settings
 * screen, not a view over time. The rollups it feeds live on Review.
 */
export default async function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <AppShell email={user.email} title="Categories">
      {children}
    </AppShell>
  );
}
