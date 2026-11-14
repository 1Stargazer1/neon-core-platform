const upgradeDialog = document.querySelector("#upgrade-dialog");
const upgradeTitle = document.querySelector("#upgrade-title");
const upgradeDescription = document.querySelector("#upgrade-description");

const upgradePlans = {
  lifetime: {
    title: "Lifetime Premium preview.",
    description: "$8.99 AUD once. The proposed one-time option would include the Premium features defined at launch.",
  },
  subscription: {
    title: "Monthly Premium preview.",
    description: "$3.99 AUD per month. The proposed subscription would include Premium features while active.",
  },
};

document.querySelectorAll("[data-upgrade-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = upgradePlans[button.dataset.upgradePlan];
    if (!plan || typeof upgradeDialog.showModal !== "function") return;
    upgradeTitle.textContent = plan.title;
    upgradeDescription.textContent = plan.description;
    upgradeDialog.showModal();
  });
});

document.querySelectorAll("[data-close-upgrade]").forEach((button) => {
  button.addEventListener("click", () => upgradeDialog.close());
});

upgradeDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && upgradeDialog.open) {
    event.preventDefault();
    upgradeDialog.close();
  }
});

upgradeDialog.addEventListener("click", (event) => {
  if (event.target === upgradeDialog) upgradeDialog.close();
});