"use client";
import { useEffect, useState } from "react";
import { createNotification, getTeacherNotifications } from "./api";

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notificationType, setNotificationType] = useState("公告");
  const teacherId = 1; // 假设教师 ID 固定为 1

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const data = await getTeacherNotifications(teacherId);
    setNotifications(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createNotification({ title, content, notificationType, createdBy: teacherId, recipientType: "学生", recipientId: 2, teacherId });
    setTitle("");
    setContent("");
    loadNotifications();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">发布通知</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" className="border p-2 w-full" placeholder="通知标题" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="border p-2 w-full" placeholder="通知内容" value={content} onChange={(e) => setContent(e.target.value)} required />
        <select className="border p-2 w-full" value={notificationType} onChange={(e) => setNotificationType(e.target.value)}>
          <option value="公告">公告</option>
          <option value="提醒">提醒</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">发布</button>
      </form>

      <h2 className="text-xl font-bold mt-6">已发布通知</h2>
      <ul className="mt-4 space-y-2">
        {notifications.map((notif: { id: number; title: string; content: string; notificationType: string; createdAt: string }) => (
          <li key={notif.id} className="border p-4">
            <p className="font-bold">{notif.title}</p>
            <p>{notif.content}</p>
            <p className="text-sm text-gray-500">类型: {notif.notificationType} | 发布时间: {new Date(notif.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
