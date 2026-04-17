import { NextResponse } from "next/server";
import { z } from "zod";
import { changeOwnPasswordWithApi } from "@/src/services/auth/api";
import { getRouteAccessToken, handleRouteError, unauthorizedRouteResponse } from "@/src/services/shared/route-handler";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual e obrigatoria"),
  newPassword: z.string().min(8, "A nova senha deve ter no minimo 8 caracteres"),
  confirmNewPassword: z.string().min(8, "A confirmacao da senha e obrigatoria"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "As senhas nao coincidem",
  path: ["confirmNewPassword"],
});

export async function POST(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const rawBody = await request.json();
    const result = passwordSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.errors[0]?.message ?? "Dados invalidos" },
        { status: 400 }
      );
    }

    await changeOwnPasswordWithApi(accessToken, result.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
