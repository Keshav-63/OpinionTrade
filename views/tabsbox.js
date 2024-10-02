const tabsBox = document.querySelector(".tabs-box"),
allTabs = tabsBox.querySelectorAll(".tab"),
arrowiconss = document.querySelectorAll(".icons i");

let isDragging = false;

const handleiconss = (scrollVal) => {
let maxScrollableWidth = tabsBox.scrollWidth - tabsBox.clientWidth;
arrowiconss[0].parentElement.style.display = scrollVal <= 0 ? "none" : "flex";
arrowiconss[1].parentElement.style.display = maxScrollableWidth - scrollVal <= 1 ? "none" : "flex";
}

arrowiconss.forEach(icons => {
icons.addEventListener("click", () => {
    // if clicked icons is left, reduce 350 from tabsBox scrollLeft else add
    let scrollWidth = tabsBox.scrollLeft += icons.id === "left" ? -340 : 340;
    handleiconss(scrollWidth);
});
});

allTabs.forEach(tab => {
tab.addEventListener("click", () => {
    tabsBox.querySelector(".active").classList.remove("active");
    tab.classList.add("active");
});
});

const dragging = (e) => {
if (!isDragging) return;
tabsBox.classList.add("dragging");
tabsBox.scrollLeft -= e.movementX;
handleiconss(tabsBox.scrollLeft)
}

const dragStop = () => {
isDragging = false;
tabsBox.classList.remove("dragging");
}

tabsBox.addEventListener("mousedown", () => isDragging = true);
tabsBox.addEventListener("mousemove", dragging);
document.addEventListener("mouseup", dragStop);