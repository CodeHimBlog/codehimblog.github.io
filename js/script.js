document.addEventListener("DOMContentLoaded", function () {
    const toggleContributorsLink = document.getElementById("toggleContributors");
    const contributorsList = document.getElementById("contributorsList");
    const maxVisibleContributors = 5;

    if (toggleContributorsLink && contributorsList) {
        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Function to toggle contributors visibility
        function toggleContributors() {
            const isExpanded = toggleContributorsLink.textContent.includes("View Less");

            // Toggle visibility
            contributors.forEach((contributor, index) => {
                if (index >= maxVisibleContributors) {
                    if (isExpanded) {
                        contributor.classList.add("d-none");
                    } else {
                        contributor.classList.remove("d-none");
                    }
                }
            });

            // Update the link text
            toggleContributorsLink.textContent = isExpanded
                ? `+${totalContributors - maxVisibleContributors} more Contributors`
                : "View Less";
        }

        // Add the click event listener
        toggleContributorsLink.addEventListener("click", function (e) {
            e.preventDefault();
            toggleContributors();
        });

        // Initial state setup (if necessary)
        toggleContributors(); // Ensure initial DOM state matches the button state
    }
});
