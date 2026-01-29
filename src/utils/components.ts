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
  return newEmails.filter((email) => !existingEmails.includes(email));
};

export const findAddedEmails = (
  newEmails: string[],
  currentEmails: string[]
): string[] => {
  return newEmails.filter((email) => !currentEmails.includes(email));
};
