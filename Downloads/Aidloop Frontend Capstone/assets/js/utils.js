export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function formatDate(dateValue, month = "short") {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month,
    year: "numeric"
  });
}

export function getLocationText(entity) {
  if (typeof entity?.location === "string" && entity.location.trim()) {
    return entity.location;
  }

  if (entity?.location && typeof entity.location === "object") {
    return [
      entity.location.venue,
      entity.location.city || entity.location.state
    ].filter(Boolean).join(", ");
  }

  return entity?.city || entity?.state || "—";
}
