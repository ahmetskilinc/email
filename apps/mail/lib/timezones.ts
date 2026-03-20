export const getBrowserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const isValidTimezone = (timezone: string) => {
  try {
    return Intl.supportedValuesOf('timeZone').includes(timezone);
  } catch (error) {
    console.error(error);
    return false;
  }
};
