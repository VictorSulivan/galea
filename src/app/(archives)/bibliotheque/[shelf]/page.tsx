import { loadShelf } from "@/lib/books";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ shelf: string }> }) {
  const { shelf } = await params;
  const context = await loadShelf(shelf);
  return { title: context?.shelf.name ?? "Rayon" };
}

export default async function ShelfPage({ params }: { params: Promise<{ shelf: string }> }) {
  const { shelf } = await params;
  const context = await loadShelf(shelf);
  if (!context) notFound();
  return null;
}
