document.addEventListener('DOMContentLoaded', function() {
    // Function to load the leaderboard data from CSV
    function loadLeaderboardData() {
        const tableBody = document.getElementById('leaderboard-data');

        // If the leaderboard element doesn't exist on this page, don't try to load data
        if (!tableBody) {
            // console.warn("Leaderboard element with ID 'leaderboard-data' not found on this page.");
            return;
        }

        // Display initial loading message if not already set by HTML
        if (!tableBody.innerHTML.includes('Loading donor data...')) {
             tableBody.innerHTML = '<tr><td colspan="3">Loading donor data...</td></tr>';
        }

        fetch('leaderboard.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const rows = data.trim().split('\n'); // Trim to remove potential trailing newlines

                if (rows.length <= 1) { // Only header or empty file
                    tableBody.innerHTML = '<tr><td colspan="3">No donor data available yet. Be the first!</td></tr>';
                    return;
                }

                // const headers = rows[0].split(','); // First row is headers, skipped by loop starting at 1

                tableBody.innerHTML = ''; // Clear existing table data (like "Loading...")

                // Add data rows, skipping the header row (i=0)
                for (let i = 1; i < rows.length; i++) {
                    if (rows[i].trim() === '') continue; // Skip any empty lines

                    const cells = rows[i].split(',');

                    if (cells.length < 3) { // Expecting at least Rank, Name, Amount
                        console.warn(`Skipping malformed CSV row: ${rows[i]}`);
                        continue;
                    }
                    
                    const row = document.createElement('tr');
                    
                    // Column 1: Rank
                    const rankCell = document.createElement('td');
                    rankCell.textContent = cells[0].trim();
                    row.appendChild(rankCell);

                    // Column 2: Name
                    const nameCell = document.createElement('td');
                    nameCell.textContent = cells[1].trim();
                    row.appendChild(nameCell);
                    
                    // Column 3: Amount
                    const amountCell = document.createElement('td');
                    const amountValue = parseFloat(cells[2].trim());
                    if (!isNaN(amountValue)) {
                        amountCell.textContent = '₨ ' + amountValue.toLocaleString();
                    } else {
                        // Fallback if amount is not a valid number, though CSV should be clean
                        amountCell.textContent = '₨ ' + cells[2].trim(); 
                    }
                    row.appendChild(amountCell);
                    
                    tableBody.appendChild(row);
                }
            })
            .catch(error => {
                console.error('Error loading or parsing leaderboard data:', error);
                if (tableBody) { // Check again tableBody exists
                    tableBody.innerHTML = '<tr><td colspan="3">Leaderboard data is currently unavailable. Please check back later.</td></tr>';
                }
            });
    }
    
    // Load the leaderboard data when the page loads
    loadLeaderboardData();
});
