import z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email")
    .email("Email không đúng định dạng (ví dụ: user@example.com)"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, "Vui lòng nhập họ và tên")
      .min(2, "Họ và tên tối thiểu 2 ký tự"),
    email: z
      .string()
      .min(1, "Vui lòng nhập địa chỉ email")
      .email("Email không đúng định dạng (ví dụ: user@example.com)"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu xác nhận"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
