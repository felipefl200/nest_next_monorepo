import { NextResponse } from "next/server";
import { z } from "zod";
import { updateOwnAccountProfileWithApi } from "@/src/services/auth/api";
import { getRouteAccessToken, handleRouteError, unauthorizedRouteResponse } from "@/src/services/shared/route-handler";

const profileSchema = z.object({
  name: z.string().trim().min(1, "O nome e obrigatorio"),
  email: z.string().trim().email("E-mail invalido"),
  currentPassword: z.string().min(1, "A senha atual e obrigatoria"),
});

export async function PATCH(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const rawBody = await request.json();
    const result = profileSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.errors[0]?.message ?? "Dados invalidos" },
        { status: 400 }
      );
    }

    const user = await updateOwnAccountProfileWithApi(accessToken, result.data);
    return NextResponse.json(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
