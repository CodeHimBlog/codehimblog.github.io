document.addEventListener("DOMContentLoaded", function () {
        const toggleContributorsLink = document.getElementById("toggleContributors");
        const contributorsList = document.getElementById("contributorsList");
        const maxVisibleContributors = 5;
        
        // Only proceed if there are more than maxVisibleContributors
        if (toggleContributorsLink) {
            const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
            const totalContributors = contributors.length;

            // Set the initial state to show only the first 5 contributors
            function toggleContributors() {
                const isShowingAll = toggleContributorsLink.textContent === "View Less";
                
                // Show or hide contributors beyond the first 5
                contributors.forEach((contributor, index) => {
                    if (isShowingAll || index < maxVisibleContributors) {
                        contributor.classList.remove("d-none");
                    } else {
                        contributor.classList.add("d-none");
                    }
                });

                // Toggle the link text based on the current state
                if (isShowingAll) {
                    toggleContributorsLink.textContent = `+${totalContributors - maxVisibleContributors} more Contributors`;
                } else {
                    toggleContributorsLink.textContent = "View Less";
                }
            }

            // Initial call to ensure the first 5 contributors are shown
            toggleContributors();

            // Event listener for clicking the toggle link
            toggleContributorsLink.addEventListener("click", function (e) {
                e.preventDefault();
                toggleContributors();  // Toggle contributors and update link text
            });
        }
    });
