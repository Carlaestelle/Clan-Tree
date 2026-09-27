export function fullName(person: { firstName: string; lastName?: string | null }): string {
  return person.lastName ? `${person.firstName} ${person.lastName}` : person.firstName;
}