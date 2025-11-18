export const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

export const isClient = () => typeof window !== 'undefined';
