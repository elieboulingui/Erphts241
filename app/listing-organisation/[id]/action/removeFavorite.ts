"use server"

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function removeFavorite(contactId: string, organisationId: string) {
  try {
    // Get the user ID from the session (à adapter selon ta logique d'authentification)
    const session = await auth() // Si tu utilises un système d'authentification
    const userId = session?.user?.id

    if (!userId) {
      return { success: false, error: "Utilisateur non authentifié" }
    }

    // Delete the favorite
    const deletedFavorite = await prisma.favorite.delete({
      where: {
        contactId_organisationId: {
          contactId,
          organisationId,
        },
      },
    })

    // Create an activity log for the removal
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "Favorite",
        entityId: deletedFavorite.id,
        oldData: deletedFavorite, // Si tu veux sauvegarder les anciennes données
        organisationId,
        createdByUserId: userId,
        relatedUserId: userId,
        entityName: "Suppression des favoris",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing favorite:", error)
    return { success: false, error: "Échec de la suppression du favori" }
  }
}
