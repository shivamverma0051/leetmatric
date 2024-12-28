document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // Validate username with regex
    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    // Fetch user details from the LeetCode API via proxy
    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;

            // Proxy server URL (replace with your own backend server if needed)
            const proxyUrl = "http://localhost:3000/leetcode";

            const headers = new Headers();
            headers.append("Content-Type", "application/json");

            const graphql = JSON.stringify({
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username },
            });

            const requestOptions = {
                method: "POST",
                headers,
                body: graphql,
            };

            const response = await fetch(proxyUrl, requestOptions);
            if (!response.ok) {
                throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
            }

            const parsedData = await response.json();
            console.log("API Response:", parsedData); // Debugging log

            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error("User not found or invalid response format.");
            }

            displayUserData(parsedData);
        } catch (error) {
            console.error("Error fetching user details:", error);
            statsContainer.innerHTML = `<p>${error.message}</p>`;
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    // Update progress bars and labels
    function updateProgress(solved, total, label, circle) {
        const progressDegree = (solved / total) * 100;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    // Display user data on the page
    function displayUserData(parsedData) {
        const totalEasyQues = parsedData.data.allQuestionsCount.find(q => q.difficulty === "Easy").count;
        const totalMediumQues = parsedData.data.allQuestionsCount.find(q => q.difficulty === "Medium").count;
        const totalHardQues = parsedData.data.allQuestionsCount.find(q => q.difficulty === "Hard").count;

        const solvedTotalEasyQues = parsedData.data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === "Easy").count;
        const solvedTotalMediumQues = parsedData.data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === "Medium").count;
        const solvedTotalHardQues = parsedData.data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === "Hard").count;

        updateProgress(solvedTotalEasyQues, totalEasyQues, easyLabel, easyProgressCircle);
        updateProgress(solvedTotalMediumQues, totalMediumQues, mediumLabel, mediumProgressCircle);
        updateProgress(solvedTotalHardQues, totalHardQues, hardLabel, hardProgressCircle);

        const cardsData = [
            { label: "Overall Submissions", value: parsedData.data.matchedUser.submitStats.totalSubmissionNum.reduce((sum, q) => sum + q.submissions, 0) },
            { label: "Easy Submissions", value: solvedTotalEasyQues },
            { label: "Medium Submissions", value: solvedTotalMediumQues },
            { label: "Hard Submissions", value: solvedTotalHardQues },
        ];

        console.log("Card Data: ", cardsData);

        cardStatsContainer.innerHTML = cardsData
            .map(
                (data) =>
                    `<div class="card">
                        <h4>${data.label}</h4>
                        <p>${data.value}</p>
                    </div>`
            )
            .join("");
    }

    // Add event listener to the search button
    searchButton.addEventListener("click", function () {
        const username = usernameInput.value;
        console.log("Username entered: ", username);
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});
