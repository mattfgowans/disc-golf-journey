import { RequireAuth } from "@/components/auth/require-auth";
import { PATCHES } from "@/lib/patches/patchCatalog";
import { PatchDetailClient } from "./PatchDetailClient";

export function generateStaticParams() {
  return PATCHES.map((p) => ({ slug: p.slug }));
}

export default function PatchDetailPage() {
  return (
    <RequireAuth>
      <PatchDetailClient />
    </RequireAuth>
  );
}
