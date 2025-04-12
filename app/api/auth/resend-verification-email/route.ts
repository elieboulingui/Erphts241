import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { identifier, token } = await req.json();

    console.log("Requête reçue:", { identifier, token });

    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
      include: {
        user: true,
      },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 400 }
      );
    }

    if (!verificationToken.user) {
      return NextResponse.json(
        { message: "Utilisateur introuvable pour ce token" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        id: verificationToken.user.id,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    return NextResponse.json(
      { message: "Email vérifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur pendant la vérification du token:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
