document.addEventListener("DOMContentLoaded", function () {
        const contributorsList = document.querySelector("#contributorsList");
        const toggleContributorsLink = document.getElementById("toggleContributors");
        const maxVisibleContributors = 5;

        const contributors = Array.from(contributorsList.getElementsByClassName("contributor-item"));
        const totalContributors = contributors.length;

        // Function to toggle between showing more or fewer contributors
        function toggleContributors() {
            const isShowingAll = toggleContributorsLink.textContent === "View Less";
            
            contributors.forEach((contributor, index) => {
                if (isShowingAll || index < maxVisibleContributors) {
                    contributor.classList.remove("d-none");
                } else {
                    contributor.classList.add("d-none");
                }
            });

            if (isShowingAll) {
                toggleContributorsLink.textContent = `+${totalContributors - maxVisibleContributors} more Contributors`;
            } else {
                toggleContributorsLink.textContent = "View Less";
            }
        }

        if (toggleContributorsLink) {
            toggleContributorsLink.addEventListener("click", function (e) {
                e.preventDefault();
                toggleContributors();
            });
        }
    });
