/**
 * PickPl 3.0 – 메인 페이지
 * 
 * 데이터: localhost:8080/api/places (SSR)
 * 렌더링: ResponsiveApp (Client Component)
 */

import ResponsiveApp from "@/components/ResponsiveApp";

// ── Types ──────────────────────────────────────────────────────────
interface TagInfo {
  id: number;
  name: string;
  type: "MOOD" | "FACILITY" | "WEATHER";
}

interface Place {
  id: number;
  name: string;
  thumbnailUrl: string;
  address: string;
  category: string;
  aiMoodSummary: string | null;
  tags: TagInfo[];
}

// ── SSR Data Fetch ─────────────────────────────────────────────────
async function getPlaces(): Promise<Place[]> {
  try {
    const res = await fetch("http://localhost:8080/api/v1/places", {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[API] /api/places 오류: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.content || [];
  } catch (err) {
    console.error("[API] 백엔드 연결 실패 (localhost:8080)", err);
    return [];
  }
}

// ── Page ───────────────────────────────────────────────────────────
export default async function DiscoverPage() {
  const places = await getPlaces();

  return (
    <ResponsiveApp initialPlaces={places} />
  );
}
