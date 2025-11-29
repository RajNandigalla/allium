// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const translate = (txt: string, obj: any): string => {
  if (!txt) return '';
  if (!obj) return txt;

  return Object.keys(obj).reduce((acc: string, key: string): string => {
    const placeholder = `{${key}}`;
    if (acc.includes(placeholder)) {
      return acc.replace(new RegExp(placeholder, 'g'), obj[key]);
    }
    return acc;
  }, txt);
};
