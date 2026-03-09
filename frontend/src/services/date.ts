export const parseCustomDate = (dateString: string) => {
  const [day, month, year] = dateString.split('.');
  return new Date(Number(year), Number(month) - 1, Number(day));
}