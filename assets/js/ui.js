export function bindFilterButtons(buttons, onChange) {
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      onChange(button.dataset.filter);
    });
  });
}

export function renderMessageRow(tbody, colSpan, message) {
  tbody.innerHTML = `<tr><td colspan="${colSpan}">${message}</td></tr>`;
}
