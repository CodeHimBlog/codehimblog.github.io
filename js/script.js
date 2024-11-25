document.addEventListener("DOMContentLoaded", function () {
    const toggleContributorsLink = document.getElementById("toggleContributors");
    const contributorsList = document.getElementById("contributorsList");
    const maxVisibleContributors = 5;

    if (toggleContributorsLink && contributorsList) {
        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Initialize: Set the correct state for the button and list
        const initState = toggleContributorsLink.textContent.includes("more");
        if (initState) {
            contributors.forEach((contributor, index) => {
                if (index >= maxVisibleContributors) {
                    contributor.classList.add("d-none");
                }
            });
        }

        // Function to toggle contributors visibility
        function toggleContributors() {
            const isShowingAll = toggleContributorsLink.textContent === "View Less";

            // Toggle visibility
            contributors.forEach((contributor, index) => {
                if (isShowingAll || index < maxVisibleContributors) {
                    contributor.classList.remove("d-none");
                } else {
                    contributor.classList.add("d-none");
                }
            });

            // Update the button text
            toggleContributorsLink.textContent = isShowingAll
                ? `+${totalContributors - maxVisibleContributors} more Contributors`
                : "View Less";
        }

        // Add the click event listener
        toggleContributorsLink.addEventListener("click", function (e) {
            e.preventDefault();
            toggleContributors();
        });
    }
});
