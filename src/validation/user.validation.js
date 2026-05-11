import {z} from "zod";
export const userRegisterSchema = z.object({
  nid: z
    .string()
    .trim()
    .regex(/^\d{10,12}$|^\d{2}-\d{2}-\d{2}-\d{6}$/, "Invalid Nepal National ID format"),
  FirstName: z.string().trim().min(3, "First name must be at least 3 characters").max(50),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^98\d{8}$/, "Invalid Nepali mobile number — must start with 98 and be 10 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
}).refine((data) => {

  if (data.email !== process.env.ADMIN_EMAIL) {
    return data.nid && data.FirstName && data.phone;
  }
  return true;
}, { message: "NID, Name, and Phone are required" });


export const userLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
