export const isClient = () => import.meta.client;

export const copyToClipboard = (text: string) => isClient() ? navigator.clipboard.writeText(text) : Promise.resolve();
