document.addEventListener("DOMContentLoaded", function () {
    const toggleContributorsLink = document.getElementById("toggleContributors");
    const contributorsList = document.getElementById("contributorsList");
    const maxVisibleContributors = 5;

    if (toggleContributorsLink && contributorsList) {
        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Function to toggle visibility of contributors
        function toggleContributors() {
            const isExpanded = toggleContributorsLink.textContent.includes("View Less");

            // Toggle visibility
            contributors.forEach((contributor, index) => {
                if (index >= maxVisibleContributors) {
                    if (isExpanded) {
                        contributor.classList.add("d-none"); // Hide beyond maxVisibleContributors
                    } else {
                        contributor.classList.remove("d-none"); // Show all contributors
                    }
                }
            });

            // Update the link text
            toggleContributorsLink.textContent = isExpanded
                ? `+${totalContributors - maxVisibleContributors} more Contributors`
                : "View Less";
        }

        // Initial setup to ensure only the first 5 contributors are visible
        contributors.forEach((contributor, index) => {
            if (index >= maxVisibleContributors) {
                contributor.classList.add("d-none"); // Hide contributors beyond maxVisibleContributors
            }
        });

        // Set the initial link text
        toggleContributorsLink.textContent = `+${totalContributors - maxVisibleContributors} more Contributors`;

        // Add click event listener
        toggleContributorsLink.addEventListener("click", function (e) {
            e.preventDefault();
            toggleContributors();
        });
    }
});
