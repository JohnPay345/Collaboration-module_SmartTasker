export const setMonth = (month = 1) => {
  const date = new Date();
  date.setMonth(date.getMonth() + month);
  return date;
};

export const setDate = (day = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + day);
  return date;
};

export const setHours = (hours = 1) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

export const setMinutes = (minutes = 1) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

export const setSeconds = (seconds = 60) => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + seconds);
  return date;
};