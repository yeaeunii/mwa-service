export function useElectron() {
  const invoke = async <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return window.api.invoke(channel, ...args) as Promise<T>
  }

  const send = (channel: string, ...args: unknown[]): void => {
    window.api.send(channel, ...args)
  }

  const on = (channel: string, listener: (...args: unknown[]) => void): (() => void) => {
    return window.api.on(channel, listener)
  }

  return {
    invoke,
    send,
    on
  }
}
