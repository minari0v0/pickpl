import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PickPl | 공간 관리 센터",
  description: "PickPl 관리자 대시보드",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
