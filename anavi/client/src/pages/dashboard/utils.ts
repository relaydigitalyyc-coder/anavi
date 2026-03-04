export type RelationshipDisplay = {
  id: number;
  name: string;
  company?: string | null;
  trustScore?: number | null;
};

export function normalizeRelationshipsForDisplay(list: unknown[]): RelationshipDisplay[] {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((rel: any) => {
    const id = Number(rel?.id ?? 0);
    const name =
      typeof rel?.name === "string"
        ? rel.name
        : typeof rel?.contact?.name === "string"
          ? rel.contact.name
          : `Relationship #${id}`;
    const company =
      (rel?.company as string | null | undefined) ??
      (rel?.contact?.company as string | null | undefined) ??
      null;
    const trustScore =
      typeof rel?.trustScore === "number"
        ? rel.trustScore
        : typeof rel?.contact?.trustScore === "number"
          ? rel.contact.trustScore
          : null;
    return { id, name, company, trustScore };
  });
}
