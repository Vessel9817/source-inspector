export interface AttributeCacheEntry {
    id: string;
    attrName: string;
}

/**
 * Keeps one inspector id per attribute name, even when the browser replaces
 * the underlying Attr node while editing HTML in DevTools.
 */
export function updateAttributeCache(
    cache: AttributeCacheEntry[],
    id: string,
    attributeName: string
): AttributeCacheEntry {
    const attrName = attributeName.toLowerCase();
    const byName = cache.find((entry) => entry.attrName === attrName);

    if (byName != null) {
        byName.id = id;
        return byName;
    }

    const byId = cache.find((entry) => entry.id === id);

    if (byId != null) {
        byId.attrName = attrName;
        return byId;
    }

    const entry = { id, attrName };
    cache.push(entry);
    return entry;
}
