import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Tableau de bord</h1>
      <p className="mb-6 text-gray-400">
        Pose une question et ouvre le tableau pour dessiner des indices.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard/whiteboard"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
        >
          Ouvrir le tableau
        </Link>
      </div>
    </div>
  );
}
