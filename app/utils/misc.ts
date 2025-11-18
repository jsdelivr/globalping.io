export const isClient = () => typeof window !== 'undefined';

export const copyToClipboard = (text: string) => isClient() ? navigator.clipboard.writeText(text) : Promise.resolve();
