"use client";
import { useEffect, useState } from "react";
import { getStudentNotifications, markNotificationAsRead } from "./api";

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const studentId = 2; // 假设学生 ID 固定为 2

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const data = await getStudentNotifications(studentId);
    setNotifications(data);
  }

  async function handleMarkRead(notificationId: number) {
    await markNotificationAsRead(notificationId);
    loadNotifications();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">我的通知</h2>
      <ul className="mt-4 space-y-2">
        {notifications.map((notif: { id: number; title: string; content: string; notificationType: string; createdAt: string; readStatus: string }) => (
          <li key={notif.id} className={`border p-4 ${notif.readStatus === "未读" ? "bg-yellow-100" : "bg-gray-100"}`}>
            <p className="font-bold">{notif.title}</p>
            <p>{notif.content}</p>
            <p className="text-sm text-gray-500">类型: {notif.notificationType} | 发布时间: {new Date(notif.createdAt).toLocaleString()}</p>
            {notif.readStatus === "未读" && (
              <button className="bg-green-500 text-white px-4 py-2 rounded mt-2" onClick={() => handleMarkRead(notif.id)}>标记为已读</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
