"use client";

import AdminLayout from "@/components/AdminLayout";
import { NotificationProvider } from '@/context/NotificationContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  useEffect(() => {
    axios.get('/api/users/current').then(r => setUserId(r.data?.id)).catch(() => setUserId(undefined));
  }, []);
  return (
    <NotificationProvider userId={userId}>
      <AdminLayout>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </AdminLayout>
    </NotificationProvider>
  );
}