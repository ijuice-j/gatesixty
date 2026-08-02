import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/user";
import { CATEGORY_COLS, toCategory } from "@/lib/categories/rows";
import { GOOGLE_COLORS } from "@/lib/google/calendar";
import { CategoryRow } from "../../category-row";

// Written on every rename, so never cached.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getUser(), // cache()'d — the layout already asked
    supabase.from("event_categories").select(CATEGORY_COLS).order("color_id"),
  ]);
  if (!user) redirect("/login");

  const byColorId = new Map(
    (data ?? []).map(toCategory).map((c) => [c.colorId, c]),
  );
  const named = byColorId.size;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 sm:px-8 lg:py-10">
      <section>
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
          Name your calendar colours
        </h2>

        <div className="ds-card ds-card--bordered gap-0 overflow-hidden p-0">
          <div className="divide-y divide-[var(--color-kumo-line)]">
            {GOOGLE_COLORS.map((c) => (
              <CategoryRow
                key={c.id}
                colorId={c.id}
                hex={c.hex}
                googleName={c.name}
                name={byColorId.get(c.id)?.name ?? ""}
              />
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--text-color-kumo-inactive)]">
          {named === 0 ? (
            <>
              Nothing named yet. Colour an event in Google Calendar, name that colour
              here, and it starts rolling up on{" "}
              <Link
                href="/month"
                className="text-[var(--text-color-kumo-info)] underline"
              >
                your month
              </Link>
              .
            </>
          ) : (
            <>
              {named} of 11 named. Empty the box to un-name a colour — nothing is stored
              per event, so its blocks simply go back to Uncategorised.
            </>
          )}
        </p>
      </section>

      {/*
       * The eleven are Google's, not ours — this screen cannot offer a twelfth, and
       * saying so here is cheaper than letting someone hunt for the Add button.
       *
       * The retroactive note is the important one: it is the property that makes this
       * worth adopting at all, and it is not guessable from a list of colour swatches.
       */}
      <section className="mt-12">
        <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-color-kumo-subtle)]">
          How this works
        </h2>
        <div className="ds-card ds-card--bordered">
          <ul className="flex list-disc flex-col gap-3 pl-5 text-base text-[var(--text-color-kumo-subtle)]">
            <li>
              A block&apos;s category is its Google Calendar colour. Set the colour on
              the event; a recurring series only needs it once.
            </li>
            <li>
              Nothing is stored per event, so recolouring reaches backwards — recolour a
              block in Google and every past occurrence moves category on the next sync.
            </li>
            <li>
              Eleven colours is Google&apos;s limit, not a setting. An event can hold one
              colour, so it lands in exactly one category and hours never double-count.
            </li>
            <li>
              Blocks on events with no colour set roll up as{" "}
              <span className="text-[var(--text-color-kumo-default)]">Uncategorised</span>
              , which is shown rather than hidden so you can see what&apos;s still unfiled.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
