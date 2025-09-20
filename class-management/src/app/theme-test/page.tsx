'use client';

import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeTestPage() {
  const { mode } = useTheme();

  return (
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          主题测试页面
        </Typography>
        <ThemeToggle />
      </Box>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        当前模式: {mode === 'light' ? '浅色' : '深色'}
      </Typography>

      <Card sx={{ maxWidth: 400, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            测试卡片
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            这是一个测试卡片，用于展示主题切换效果。点击右上角的主题切换按钮可以在浅色和深色模式之间切换。
          </Typography>
          <Button variant="contained" size="small">
            测试按钮
          </Button>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary">
        主题设置会自动保存在本地存储中。
      </Typography>
    </Box>
  );
}