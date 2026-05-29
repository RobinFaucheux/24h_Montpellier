export default defineEventHandler(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })
  return categories
})
