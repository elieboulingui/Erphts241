import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      console.log("Utilisateur non authentifié")
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 })
    }

    const ownerId = session.user.id
    console.log("ID du propriétaire:", ownerId)

    let body
    try {
      body = await request.json()
      console.log("Corps de la requête:", body)
    } catch (error) {
      console.error("Erreur lors du parsing du corps de la requête:", error)
      return NextResponse.json({ error: "Format de requête invalide" }, { status: 400 })
    }

    const { name, slug, logo, domain } = body

    if (!name) {
      return NextResponse.json({ error: "Le nom de l'organisation est requis" }, { status: 400 })
    }

    if (!slug) {
      return NextResponse.json({ error: "Le slug de l'organisation est requis" }, { status: 400 })
    }

    if (!domain) {
      return NextResponse.json({ error: "Le domaine de l'organisation est requis" }, { status: 400 })
    }

    const validDomains = [
      "AGRICULTURE", "ENERGIE", "LOGISTIQUE", "NUMERIQUE", "SECURITE", 
      "TRANSPORT", "INFORMATIQUE", "SANTE", "EDUCATION", "FINANCE", 
      "COMMERCE", "CONSTRUCTION", "ENVIRONNEMENT", "TOURISME", "INDUSTRIE", 
      "TELECOMMUNICATIONS", "IMMOBILIER", "ADMINISTRATION", "ART_CULTURE", "ALIMENTATION"
    ]

    const domainValue = domain.toUpperCase()
    if (!validDomains.includes(domainValue)) {
      return NextResponse.json({ error: "Le domaine spécifié n'est pas valide" }, { status: 400 })
    }

    const ownerExists = await prisma.user.findUnique({ where: { id: ownerId } })
    if (!ownerExists) {
      return NextResponse.json({ error: "L'utilisateur propriétaire spécifié n'existe pas" }, { status: 404 })
    }

    const existingSlug = await prisma.organisation.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: "Le slug spécifié existe déjà" }, { status: 400 })
    }

    // Création de l'organisation
    const organisation = await prisma.organisation.create({
      data: {
        name,
        slug,
        logo,
        ownerId,
        domain: domainValue,
      },
    })

    // Création du log d'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "Organisation",
        entityId: organisation.id,
        entityName: organisation.name,
        newData: {
          name: organisation.name,
          slug: organisation.slug,
          domain: organisation.domain,
          ownerId: organisation.ownerId,
        },
        createdByUserId: ownerId,
        organisationId: organisation.id,
        userId: ownerId, // utilisateur ayant effectué l'action
      },
    })

    console.log("Organisation créée avec succès:", organisation)
    return NextResponse.json({ message: "Organisation créée avec succès", organisation }, { status: 201 })
  } catch (error) {
    console.error("Erreur générale:", error)
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de la création de l'organisation" },
      { status: 500 },
    )
  }
}
