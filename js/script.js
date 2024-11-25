 document.addEventListener("DOMContentLoaded", function () {
        const contributorsList = document.querySelector("#contributorsList");
        const toggleContributorsLink = document.getElementById("toggleContributors");
        const maxVisibleContributors = 5;

        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Function to toggle between showing more or fewer contributors
        function toggleContributors() {
            const isShowingAll = toggleContributorsLink.textContent === "View Less";
            
            // Show or hide contributors based on the toggle state
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

        // Click event for the "View More / View Less" link
        if (toggleContributorsLink) {
            toggleContributorsLink.addEventListener("click", function (e) {
                e.preventDefault();
                toggleContributors();  // Toggle the contributors and text
            });
        }
    });
