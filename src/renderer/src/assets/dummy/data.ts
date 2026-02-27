const loopData = (): { id: number; title: string; description: string; images: string[] }[] => {
  return Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    title: `캡쳐 그룹 ${index + 1}`,
    description: `캡쳐 그룹 ${index + 1} 설명`,
    images: ['@/assets/dummy/images/case-1.png', '@/assets/dummy/images/case-1.png']
  }))
}

export const menualCaseItems = loopData()
