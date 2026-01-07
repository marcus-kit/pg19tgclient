import type { DirectiveBinding } from 'vue'

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      // Проверяем, что клик был вне элемента
      if (!(el === event.target || el.contains(event.target as Node))) {
        // Вызываем callback функцию
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

// Расширяем тип HTMLElement для TypeScript
declare module 'vue' {
  interface HTMLElement {
    clickOutsideEvent?: (event: MouseEvent) => void
  }
}
