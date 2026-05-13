import { asArray } from "./apiNormalize";

/**
 * Normalise un élément renvoyé par GET /project-members/... (entité ProjectMember sérialisée en JSON).
 * Gère à la fois { user: { id, fullName, email, role } } et d'éventuels champs plats.
 */
export function memberRecordFromProjectMemberApi(item) {
    if (!item) return null;
    const u = item.user;
    const id = u?.id ?? item.userId;
    if (id == null) return null;
    const fullName = u?.fullName ?? item.fullName ?? `Utilisateur #${id}`;
    const email = u?.email ?? item.email ?? "—";
    const role = u?.role ?? item.role ?? "DEVELOPER";
    return { id, fullName, email, role };
}

export function mapProjectMembersToRecords(raw) {
    return asArray(raw)
        .map(memberRecordFromProjectMemberApi)
        .filter(Boolean);
}

export function developersFromProjectMembersApi(raw) {
    return mapProjectMembersToRecords(raw).filter(
        (m) => String(m.role).trim().toUpperCase() === "DEVELOPER"
    );
}
