"use client";

import AdminLayout from "@/components/AdminLayout";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.15 }}
          style={{ height: "100%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </AdminLayout>
  );
}