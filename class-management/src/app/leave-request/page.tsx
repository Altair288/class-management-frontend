// src/app/leave-request/page.tsx
"use client";

import React, { useState } from 'react';
import axios from 'axios';

const LeaveRequestPage = () => {
  const [form, setForm] = useState({
    studentId: 1, // 实际项目应从登录信息获取
    leaveType: '病假',
    leaveReason: '',
    leaveStartDate: '',
    leaveEndDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/leave-requests', {
        studentId: form.studentId,
        leaveType: form.leaveType,
        reason: form.leaveReason,
        startDate: form.leaveStartDate,
        endDate: form.leaveEndDate,
      });
      alert('请假申请已提交');
      setForm({ ...form, leaveReason: '', leaveStartDate: '', leaveEndDate: '' });
    } catch {
      alert('提交失败');
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '40px auto',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 28, color: '#1976d2', letterSpacing: 2 }}>请假申请</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>请假类型</label>
          <select
            name="leaveType"
            value={form.leaveType}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cfd8dc',
              fontSize: 15,
            }}
          >
            <option value="病假">病假</option>
            <option value="事假">事假</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>请假理由</label>
          <textarea
            name="leaveReason"
            value={form.leaveReason}
            onChange={handleChange}
            placeholder="请输入请假理由"
            required
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cfd8dc',
              fontSize: 15,
              resize: 'vertical',
            }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>请假开始日期</label>
          <input
            type="date"
            name="leaveStartDate"
            value={form.leaveStartDate}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cfd8dc',
              fontSize: 15,
            }}
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>请假结束日期</label>
          <input
            type="date"
            name="leaveEndDate"
            value={form.leaveEndDate}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cfd8dc',
              fontSize: 15,
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '12px 0',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          提交申请
        </button>
      </form>
    </div>
  );
};

export default LeaveRequestPage;
