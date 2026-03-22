export const toggleComponent = (
  components: string[],
  component: string
): string[] => {
  if (components.includes(component)) {
    return components.filter((c) => c !== component);
  }

  return [...components, component];
};

export const filterExistingEmails = (
  newEmails: string[],
  existingEmails: string[]
): string[] => {
  const normalizedExisting = existingEmails.map((e) => e.toLowerCase());
  return newEmails.filter((email) => !normalizedExisting.includes(email.toLowerCase()));
};

export const findAddedEmails = (
  newEmails: string[],
  currentEmails: string[]
): string[] => {
  return newEmails.filter((email) => !currentEmails.includes(email));
};
