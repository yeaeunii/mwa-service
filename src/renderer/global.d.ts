import type { GlobalComponents } from 'vue'

/**
 * 컴포넌트 인스턴스 타입을 쉽게 가져오는 헬퍼 타입
 *
 * @example
 * const modalRef = ref<ComponentRef<'ModalBase'>>(null);
 */
declare global {
  type ComponentRef<T extends keyof GlobalComponents> = InstanceType<GlobalComponents[T]> | null
}

export {}
