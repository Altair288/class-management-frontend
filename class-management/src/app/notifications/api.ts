const BASE_URL = "http://localhost:8080/api/notifications";

// 发布通知（教师）
interface NotificationData {
  title: string;
  content: string;
  teacherId: number;
  notificationType: string;
  recipientType: string;
  recipientId: number;
  createdBy: number;
}

export async function createNotification(data: NotificationData) {
  const response = await fetch(`${BASE_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

// 获取教师发布的通知
export async function getTeacherNotifications(teacherId: number) {
  const response = await fetch(`${BASE_URL}/teacher/${teacherId}`);
  return response.json();
}

// 获取学生的通知
export async function getStudentNotifications(studentId: number) {
  const response = await fetch(`${BASE_URL}/${studentId}/学生`);
  return response.json();
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: number) {
  await fetch(`${BASE_URL}/mark-read/${notificationId}`, { method: "PUT" });
}
