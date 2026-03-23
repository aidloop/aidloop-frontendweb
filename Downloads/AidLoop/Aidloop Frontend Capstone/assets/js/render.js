export function renderMessageRow(tbody, colSpan, message) {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colSpan}">${message}</td>
    </tr>
  `;
}

export function toggleEmptyState(tableBody, emptyState, hasData) {
  if (!tableBody || !emptyState) return;

  if (hasData) {
    tableBody.style.display = "";
    emptyState.style.display = "none";
  } else {
    tableBody.style.display = "";
    emptyState.style.display = "flex";
  }
}