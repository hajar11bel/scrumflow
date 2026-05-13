/**
 * Spring / Axios peuvent renvoyer parfois un objet au lieu d'un tableau.
 * Évite les erreurs du type "data.map is not a function".
 */
export function asArray(data) {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.data)) return data.data;
    return [];
}
