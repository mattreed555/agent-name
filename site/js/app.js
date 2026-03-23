import { suggestNames } from "./api.js";
import { renderName, renderSkeletons, renderError, showThinking } from "./ui.js";

const sugBtn = document.getElementById("sug-btn");
const sugInput = document.getElementById("sug-input");
const sugResults = document.getElementById("sug-results");

async function doSuggest() {
  const purpose = sugInput.value.trim();

  sugBtn.disabled = true;
  sugInput.disabled = true;
  renderSkeletons(4, sugResults);

  let thinkingTimer = setTimeout(() => showThinking(sugResults), 2000);

  try {
    const data = await suggestNames(purpose);
    clearTimeout(thinkingTimer);
    sugResults.innerHTML = "";

    // Recommendation at top
    if (data.recommendation) {
      const rec = data.recommendation;
      sugResults.appendChild(
        renderName(rec.name, {
          reasoning: rec.reasoning,
          isRecommendation: true,
          recommendedNickname: rec.nickname,
        })
      );
    }

    // Other suggestions (skip first — same as recommendation)
    const recName = data.recommendation?.name?.fullName;
    (data.suggestions || [])
      .filter((s) => s.name.fullName !== recName)
      .slice(0, 4)
      .forEach((s) => {
        sugResults.appendChild(renderName(s.name, { reasoning: s.reasoning }));
      });

    // Scroll to results on narrow viewports
    if (window.innerWidth < 768) {
      sugResults.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    clearTimeout(thinkingTimer);
    sugResults.innerHTML = "";
    sugResults.appendChild(renderError(err));
  } finally {
    sugBtn.disabled = false;
    sugInput.disabled = false;
  }
}

sugBtn.addEventListener("click", doSuggest);
sugInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSuggest();
});
