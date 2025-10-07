import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'resource', 'StudentUploadTemplate.xlsx');
    const data = await fs.readFile(filePath);
    // 转成 ArrayBuffer 以满足 Response Body 类型
  const uint8 = new Uint8Array(data); // Buffer -> Uint8Array
  const blob = new Blob([uint8.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="StudentUploadTemplate.xlsx"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch {
    return new Response(JSON.stringify({ message: '模板文件不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
}
