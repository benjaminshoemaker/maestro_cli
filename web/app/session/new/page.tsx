import { Suspense } from "react";

import SessionNewClient from "./SessionNewClient";
import { SkeletonPage } from "../../../src/components/Skeleton";

export const dynamic = "force-dynamic";

export default function SessionNewPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <SessionNewClient />
    </Suspense>
  );
}
