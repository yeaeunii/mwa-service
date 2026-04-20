import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko' // 한국어 설정이 필요할 경우

// 플러그인 설치
dayjs.extend(relativeTime)
// 언어 설정 (전역)
dayjs.locale('ko')

// 날짜 포맷팅
export const formatDate = (date: Date, format: string = 'YYYY.MM.DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

// 날짜 비교
export const isBefore = (date1: Date, date2: Date): boolean => {
  return dayjs(date1).isBefore(date2)
}

// 날짜 비교
export const isAfter = (date1: Date, date2: Date): boolean => {
  return dayjs(date1).isAfter(date2)
}

// 날짜 비교
export const isSame = (date1: Date, date2: Date): boolean => {
  return dayjs(date1).isSame(date2)
}

/**
 * 입력을 받아 "방금 전", "N시간 전" 형태의 문자열을 반환합니다.
 * @param {string | number | Date} date - 과거의 날짜 데이터
 * @returns {string} 상대적 시간 문자열
 */
export const timeAgo = (date: string | number | Date): string => {
  return dayjs(date).fromNow()
}
