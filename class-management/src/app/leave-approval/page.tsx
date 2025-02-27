"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface LeaveRequest {
  id: number;
  studentId: number;
  studentName: string;
  leaveType: string;
  leaveReason: string;
  leaveStartDate: string;
  leaveEndDate: string;
  status: string;
}

export default function LeaveApprovalPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取请假申请列表
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/leave-requests")
      .then((response) => {
        setLeaveRequests(response.data);
      })
      .catch((error) => {
        console.error("获取请假数据失败:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  // 审批请假请求
  const handleApproval = (id: number, approved: boolean) => {
    axios
      .put(`http://localhost:8080/api/leave-requests/${id}/approve`, {
        status: approved ? "已批准" : "已拒绝",
      })
      .then(() => {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: approved ? "已批准" : "已拒绝" } : req
          )
        );
      })
      .catch((error) => {
        console.error("审批失败:", error);
      });
  };

  if (loading) return <p className="text-center text-lg">加载中...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">请假审批</h1>
      {leaveRequests.length === 0 ? (
        <p className="text-center">暂无请假申请</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">学生姓名</th>
              <th className="border p-2">请假类型</th>
              <th className="border p-2">原因</th>
              <th className="border p-2">开始时间</th>
              <th className="border p-2">结束时间</th>
              <th className="border p-2">状态</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((request) => (
              <tr key={request.id} className="text-center">
                <td className="border p-2">{request.studentName}</td>
                <td className="border p-2">{request.leaveType}</td>
                <td className="border p-2">{request.leaveReason}</td>
                <td className="border p-2">{request.leaveStartDate}</td>
                <td className="border p-2">{request.leaveEndDate}</td>
                <td className={`border p-2 ${request.status === "待审批" ? "text-yellow-600" : request.status === "已批准" ? "text-green-600" : "text-red-600"}`}>
                  {request.status}
                </td>
                <td className="border p-2 flex justify-center gap-2">
                  {request.status === "待审批" && (
                    <>
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={() => handleApproval(request.id, true)}
                      >
                        批准
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => handleApproval(request.id, false)}
                      >
                        拒绝
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
