export const MIN_AGE = 18;

export const GENDER_OPTIONS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const INTEREST_OPTIONS = [
  "Music",
  "Movies",
  "Travel",
  "Food",
  "Fitness",
  "Art",
  "Reading",
  "Gaming",
  "Photography",
  "Tech",
  "Sports",
  "Fashion",
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export const RELATIONSHIP_OPTIONS = [
  { value: "friendship", label: "Friendship" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Something serious" },
  { value: "figuring_out", label: "Still figuring it out" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export type RelationshipValue = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

export function getAgeFromDob(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAtLeastAge(dateOfBirth: string, minAge = MIN_AGE) {
  if (!dateOfBirth) return false;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= minAge;
}

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
