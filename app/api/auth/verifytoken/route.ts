import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, token } = body;

    console.log("Requête reçue:", body);

    // Vérifie que les champs sont présents
    if (!identifier || !token) {
      console.error("Données manquantes dans la requête:", { identifier, token });
      return NextResponse.json(
        { error: "Les données du token sont manquantes." },
        { status: 400 }
      );
    }

    // Recherche du token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    if (!verificationToken) {
      console.error("Token non trouvé ou expiré:", { identifier, token });
      return NextResponse.json(
        { error: "Token non trouvé ou expiré." },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur lié à l'email (identifier)
    const user = await prisma.user.findUnique({
      where: {
        email: identifier,
      },
    });

    if (!user) {
      console.error("Utilisateur introuvable pour l'email:", identifier);
      return NextResponse.json(
        { error: "Utilisateur introuvable pour ce token." },
        { status: 400 }
      );
    }

    // Met à jour le champ emailVerified
    await prisma.user.update({
      where: { email: identifier },
      data: { emailVerified: new Date() },
    });

    // Archive le token
    await prisma.verificationToken.update({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    // Récupération IP + User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'IP inconnue';
    const userAgent = req.headers.get('user-agent') || '';

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        action: 'Email Verification',
        entityType: 'User',
        entityId: identifier,
        userId: user.id,
        actionDetails: `Email verification successful for user ${identifier}`,
        entityName: 'User',
        createdByUserId: user.id,
        ipAddress: ip,
        userAgent: userAgent,
      },
    });

    return NextResponse.json({
      message: "Token validé et archivé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
