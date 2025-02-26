// src/app/credits.tsx
"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Credit {
  id: number;
  studentId: string;
  activityName: string;
  credit: number;
  date: string;
  teacherId: string;
  status: string;
}

const Credits = () => {
  const [studentCredits, setStudentCredits] = useState<Credit[]>([]);
  const [newCredit, setNewCredit] = useState<Credit>({ studentId: '', activityName: '', credit: 0, date: '', teacherId: '', id: 0, status: '' });

  useEffect(() => {
    const fetchStudentCredits = async () => {
      const response = await axios.get('/api/credits/student/1');  // 假设学生ID为1
      setStudentCredits(response.data);
    };

    fetchStudentCredits();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCredit({ ...newCredit, [name]: value });
  };

  const handleSubmit = async () => {
    await axios.post('/api/credits', newCredit);
    setNewCredit({ studentId: '', activityName: '', credit: 0, date: '', teacherId: '', id: 0, status: '' });
  };

  return (
    <div>
      <h2>德育学分管理</h2>
      <div>
        <h3>添加学分</h3>
        <input
          type="text"
          name="activityName"
          value={newCredit.activityName}
          onChange={handleInputChange}
          placeholder="活动名称"
        />
        <input
          type="number"
          name="credit"
          value={newCredit.credit}
          onChange={handleInputChange}
          placeholder="学分"
        />
        <input
          type="date"
          name="date"
          value={newCredit.date}
          onChange={handleInputChange}
        />
        <button onClick={handleSubmit}>提交</button>
      </div>

      <h3>我的德育学分</h3>
      <ul>
        {studentCredits.map((credit) => (
          <li key={credit.id}>
            {credit.activityName} - {credit.credit} 学分 - {credit.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Credits;
