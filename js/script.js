document.addEventListener("DOMContentLoaded", function () {
    const toggleContributorsLink = document.getElementById("toggleContributors");
    const contributorsList = document.getElementById("contributorsList");
    const maxVisibleContributors = 5;

    if (toggleContributorsLink) {
        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Function to toggle contributors visibility
        function toggleContributors() {
            const isShowingAll = toggleContributorsLink.textContent === "View Less";
            
            // Show or hide contributors based on the current state
            contributors.forEach((contributor, index) => {
                if (isShowingAll || index < maxVisibleContributors) {
                    contributor.classList.remove("d-none");
                } else {
                    contributor.classList.add("d-none");
                }
            });

            // Update the button text
            if (isShowingAll) {
                toggleContributorsLink.textContent = `+${totalContributors - maxVisibleContributors} more Contributors`;
            } else {
                toggleContributorsLink.textContent = "View Less";
            }
        }

        // Initialize the state (start with showing only the first 5)
        contributors.forEach((contributor, index) => {
            if (index >= maxVisibleContributors) {
                contributor.classList.add("d-none");
            }
        });

        // Set the initial button text
        toggleContributorsLink.textContent = `+${totalContributors - maxVisibleContributors} more Contributors`;

        // Add the click event listener
        toggleContributorsLink.addEventListener("click", function (e) {
            e.preventDefault();
            toggleContributors(); // Toggle visibility and update text
        });
    }
});
