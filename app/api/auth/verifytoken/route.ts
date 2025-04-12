import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { identifier, token } = await req.json();

  // Vérification des données reçues
  if (!identifier || !token) {
    console.error("Données manquantes dans la requête:", { identifier, token });
    return NextResponse.json(
      { error: "Les données du token sont manquantes." },
      { status: 400 }
    );
  }

  try {
    // Recherche du token de vérification avec l'utilisateur associé
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier, // Email de l'utilisateur
          token,      // Token de vérification
        },
      },
      include: {
        user: true,  // Inclure l'utilisateur lié au token
      },
    });

    // Si le token n'existe pas ou s'il n'y a pas d'utilisateur associé
    if (!verificationToken || !verificationToken.user) {
      console.error("Token non trouvé pour l'email:", identifier);
      return NextResponse.json({ error: "Token non trouvé." }, { status: 400 });
    }

    // Marquer l'utilisateur comme vérifié
    await prisma.user.update({
      where: {
        email: verificationToken.identifier,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    // Archiver le token de vérification après utilisation
    await prisma.verificationToken.update({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
    // Récupérer l'adresse IP de la requête
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'IP inconnue'; // Extraire l'IP depuis les headers

    // Enregistrement de l'action dans ActivityLog
    await prisma.activityLog.create({
      data: {
        action: 'Email Verification',
        entityType: 'User',
        entityId: verificationToken.identifier, // L'ID de l'utilisateur concerné
        userId: verificationToken.user.id,      // ID de l'utilisateur qui effectue l'action
        actionDetails: `Email verification successful for user ${verificationToken.identifier}`,
        entityName: 'User',
        createdByUserId: verificationToken.user.id,  // Celui qui a déclenché l'action
        ipAddress: ip,                              // IP de la requête
        userAgent: req.headers.get('user-agent') || '', // User agent de la requête
      },
    });

    return NextResponse.json({
      message: "Token validé et archivé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
