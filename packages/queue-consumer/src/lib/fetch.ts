export function throwErrorIfResponseNotOk(response: Response): void {
  if (!response?.ok) {
    const message = response?.status
      ? `[${response?.status} - ${response?.statusText}] ${response?.url}`
      : `[${response?.statusText}] ${response?.url}`;

    throw new Error(message);
  }
}
