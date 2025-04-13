"use server"
import prisma from '@/lib/prisma';
import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth" // adapte le chemin si besoin


export async function addFavorite(contactId: string, organisationId: string) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: "Utilisateur non authentifié" }
  }

  try {
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        contactId_organisationId: {
          contactId,
          organisationId,
        },
      },
    })

    if (existingFavorite) {
      return { success: false, error: "Ce contact est déjà dans vos favoris" }
    }

    const newFavorite = await prisma.favorite.create({
      data: {
        contactId,
        organisationId,
        createdByUserId: userId,
      },
    })

    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "Favorite",
        entityId: newFavorite.id,
        newData: newFavorite,
        organisationId,
        createdByUserId: userId,
        relatedUserId: userId,
        entityName: "Ajout aux favoris",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Erreur lors de l'ajout aux favoris:", error)
    return { success: false, error: "Échec de l'ajout aux favoris" }
  }
}
