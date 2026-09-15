import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  full_name: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
