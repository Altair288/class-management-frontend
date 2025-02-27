// src/app/leave-request/page.tsx
"use client";

import React, { useState } from 'react';
import axios from 'axios';

const LeaveRequest = () => {
  const [leaveRequest, setLeaveRequest] = useState({
    studentId: 1,  // 假设学生ID为1
    leaveType: '',
    leaveReason: '',
    leaveStartDate: '',
    leaveEndDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeaveRequest({ ...leaveRequest, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/leave-requests', leaveRequest);
      alert('请假申请已提交');
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <div>
      <h2>请假申请</h2>
      <form>
        <div>
          <label>请假类型:</label>
          <select name="leaveType" value={leaveRequest.leaveType} onChange={handleChange}>
            <option value="病假">病假</option>
            <option value="事假">事假</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div>
          <label>请假理由:</label>
          <textarea
            name="leaveReason"
            value={leaveRequest.leaveReason}
            onChange={handleChange}
            placeholder="请输入请假理由"
          />
        </div>

        <div>
          <label>请假开始日期:</label>
          <input
            type="date"
            name="leaveStartDate"
            value={leaveRequest.leaveStartDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>请假结束日期:</label>
          <input
            type="date"
            name="leaveEndDate"
            value={leaveRequest.leaveEndDate}
            onChange={handleChange}
          />
        </div>

        <button type="button" onClick={handleSubmit}>提交申请</button>
      </form>
    </div>
  );
};

export default LeaveRequest;
