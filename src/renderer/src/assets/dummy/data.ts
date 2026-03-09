// const loopData = (): { id: number; title: string; description: string; images: string[] }[] => {
//   return Array.from({ length: 20 }, (_, index) => ({
//     id: index + 1,
//     title: 캡쳐 그룹 ${index + 1},
//     description: 캡쳐 그룹 ${index + 1} 설명,
//     images: ['@/assets/dummy/images/case-1.png', '@/assets/dummy/images/case-1.png']
//   }))
// }

// export const menualCaseItems = loopData()


export const menualCaseItems: {
  id: number
  title: string
  description: string
  images: string[]
}[] = [
  {
    id: 1,
    title: '메인 화면',
    description: '메인 랜딩 화면',
    images: ['@/assets/dummy/images/case-1.png']
  },
  {
    id: 2,
    title: '로그인 화면',
    description: '사용자 로그인 화면',
    images: ['@/assets/dummy/images/case-1.png']
  }
]
