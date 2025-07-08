declare interface Window {
  __TMACSDK?: {
    SDKClient: {
      events: {
        emit(event: string, data: any): void
      }
    }
  }
}