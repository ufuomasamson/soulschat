import { LinksManager } from "@/components/admin/LinksManager";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { fetchAdminLinks } from "@/lib/admin/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Advert links",
};

export const instant = false;

export default async function AdminLinksPage() {
  const { supabase } = await requireAdmin();
  const links = await fetchAdminLinks(supabase);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-[22px] font-semibold text-text-primary">
          Advert links
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Monitor private chat links used for Facebook ads.
        </p>
      </div>
      <LinksManager initialLinks={links} />
    </div>
  );
}
