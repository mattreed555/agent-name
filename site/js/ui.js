function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function renderName(name, { reasoning, isRecommendation, recommendedNickname } = {}) {
  const el = document.createElement("div");
  el.className = "name-entry" + (isRecommendation ? " recommendation" : "");

  const pills = name.nicknames
    .map((n) => `<span class="pill">${escapeHtml(n)}</span>`)
    .join("");

  let html = `
    <div class="name-full">${escapeHtml(name.fullName)}</div>
    <div class="name-nicknames"><span class="nickname-label">Goes by:</span> ${pills}</div>
  `;

  if (isRecommendation && recommendedNickname) {
    html = `<div class="recommendation-label">Top pick — call it <strong>${escapeHtml(recommendedNickname)}</strong></div>` + html;
  }

  if (reasoning) {
    html += `<div class="name-reasoning">${escapeHtml(reasoning)}</div>`;
  }

  el.innerHTML = html;
  return el;
}

export function renderSkeletons(count, container) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "name-entry skeleton-entry";
    el.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton-row">
        <div class="skeleton skeleton-pill"></div>
        <div class="skeleton skeleton-pill"></div>
        <div class="skeleton skeleton-pill"></div>
      </div>
      <div class="skeleton skeleton-words"></div>
    `;
    container.appendChild(el);
  }
}

export function renderError(error) {
  const el = document.createElement("div");
  el.className = "error-msg" + (error.isRateLimit ? " rate-limit" : "");
  el.textContent = error.message;
  return el;
}

export function showThinking(container) {
  let el = container.querySelector(".thinking-msg");
  if (!el) {
    el = document.createElement("div");
    el.className = "thinking-msg";
    el.textContent = "Still thinking — this calls an LLM so it can take a moment…";
    container.appendChild(el);
  }
}
