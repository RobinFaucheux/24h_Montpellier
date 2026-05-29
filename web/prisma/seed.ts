import { PrismaClient } from '@prisma/client'
import { hash } from 'uncrypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Categories
  const categories = [
    { name: 'Véhicules', slug: 'vehicules', icon: 'i-lucide-car' },
    { name: 'Immobilier', slug: 'immobilier', icon: 'i-lucide-home' },
    { name: 'Électronique', slug: 'electronique', icon: 'i-lucide-smartphone' },
    { name: 'Mode', slug: 'mode', icon: 'i-lucide-shirt' },
    { name: 'Maison & Jardin', slug: 'maison-jardin', icon: 'i-lucide-sofa' },
    { name: 'Sports & Loisirs', slug: 'sports-loisirs', icon: 'i-lucide-dumbbell' },
    { name: 'Services', slug: 'services', icon: 'i-lucide-wrench' },
    { name: 'Emploi', slug: 'emploi', icon: 'i-lucide-briefcase' },
    { name: 'Livres & Multimédia', slug: 'livres-multimedia', icon: 'i-lucide-book-open' },
    { name: 'Animaux', slug: 'animaux', icon: 'i-lucide-paw-print' },
    { name: 'Jeux & Jouets', slug: 'jeux-jouets', icon: 'i-lucide-gamepad-2' },
    { name: 'Autres', slug: 'autres', icon: 'i-lucide-package' }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    })
  }

  console.log(`✅ ${categories.length} catégories créées`)

  // Demo user
  const passwordHash = await hashPassword('demo1234')
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ScamMarket.fr' },
    update: {},
    create: {
      email: 'demo@ScamMarket.fr',
      name: 'Marie Dupont',
      passwordHash,
      phone: '06 12 34 56 78',
      city: 'Montpellier',
      region: 'Occitanie'
    }
  })

  console.log(`✅ Utilisateur démo créé : ${demoUser.email}`)

  // Fetch category IDs
  const catElectronique = await prisma.category.findUnique({ where: { slug: 'electronique' } })
  const catMode = await prisma.category.findUnique({ where: { slug: 'mode' } })
  const catMaison = await prisma.category.findUnique({ where: { slug: 'maison-jardin' } })
  const catSports = await prisma.category.findUnique({ where: { slug: 'sports-loisirs' } })

  // Demo listings
  const listings = [
    {
      title: 'iPhone 15 Pro Max - Excellent état',
      description: 'iPhone 15 Pro Max 256Go, couleur Titane Noir. Acheté en janvier 2025, toujours sous garantie Apple. Livré avec boîte d\'origine, câble et coque. Aucune rayure, batterie à 97%.',
      price: 899,
      city: 'Montpellier',
      region: 'Occitanie',
      categoryId: catElectronique?.id
    },
    {
      title: 'Vélo électrique VanMoof S5',
      description: 'Vélo électrique VanMoof S5 en excellent état. Batterie longue durée, assistance électrique fluide. Parfait pour les trajets quotidiens. Antivol intégré. Kilométrage : 1200 km.',
      price: 1200,
      city: 'Lyon',
      region: 'Auvergne-Rhône-Alpes',
      categoryId: catSports?.id
    },
    {
      title: 'Canapé d\'angle convertible - Comme neuf',
      description: 'Magnifique canapé d\'angle convertible en tissu gris. Dimensions : 280x180cm. Couchage quotidien possible. Rangement intégré. Acheté il y a 6 mois chez Maisons du Monde.',
      price: 450,
      city: 'Paris',
      region: 'Île-de-France',
      categoryId: catMaison?.id
    },
    {
      title: 'Collection de vestes vintage années 90',
      description: 'Lot de 5 vestes vintage en excellent état. Marques : Levi\'s, Carhartt, Ralph Lauren. Tailles M/L. Photos supplémentaires sur demande. Prix pour le lot complet.',
      price: 180,
      city: 'Bordeaux',
      region: 'Nouvelle-Aquitaine',
      categoryId: catMode?.id
    },
    {
      title: 'MacBook Air M3 - Neuf sous blister',
      description: 'MacBook Air 15" M3, 16Go RAM, 512Go SSD. Coloris Minuit. Encore sous blister, jamais ouvert. Facture fournie. Prix ferme.',
      price: 1350,
      city: 'Toulouse',
      region: 'Occitanie',
      categoryId: catElectronique?.id
    }
  ]

  for (const listing of listings) {
    const { categoryId, ...data } = listing
    const created = await prisma.listing.create({
      data: {
        ...data,
        userId: demoUser.id,
        categories: categoryId
          ? { create: { categoryId } }
          : undefined
      }
    })
    console.log(`  📦 Annonce créée : ${created.title}`)
  }

  console.log(`✅ ${listings.length} annonces démo créées`)
  console.log('🎉 Seed terminé !')
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
