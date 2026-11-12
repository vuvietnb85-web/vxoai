import { createFileRoute } from "@tanstack/react-router";
import { VxoApp } from "@/components/vxo/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VxoApp />;
}
