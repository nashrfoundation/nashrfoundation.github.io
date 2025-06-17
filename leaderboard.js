document.addEventListener('DOMContentLoaded', function() {
    // Function to load the leaderboard data from CSV
    function loadLeaderboardData() {
        fetch('leaderboard.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                // Parse CSV data
                const rows = data.trim().split('\n');
                const tableBody = document.querySelector('#leaderboard-data');
                
                if (!tableBody) {
                    console.error('Leaderboard table body not found');
                    return;
                }
                
                // Clear existing table data
                tableBody.innerHTML = '';
                
                // Skip header row and add data rows
                for (let i = 1; i < rows.length; i++) {
                    if (rows[i].trim() === '') continue; // Skip empty rows
                    
                    const cells = rows[i].split(',');
                    if (cells.length >= 3) {
                        const row = document.createElement('tr');
                        
                        // Rank
                        const rankCell = document.createElement('td');
                        rankCell.textContent = cells[0].trim();
                        row.appendChild(rankCell);
                        
                        // Name
                        const nameCell = document.createElement('td');
                        nameCell.textContent = cells[1].trim();
                        row.appendChild(nameCell);
                        
                        // Amount
                        const amountCell = document.createElement('td');
                        const amount = cells[2].trim();
                        amountCell.textContent = '₨ ' + amount.replace(/,/g, '');
                        row.appendChild(amountCell);
                        
                        tableBody.appendChild(row);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading leaderboard data:', error);
                // Display a fallback message if data can't be loaded
                const tableBody = document.querySelector('#leaderboard-data');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="3">Error loading donor data. Please try again later.</td></tr>';
                }
            });
    }
    
    // Load the leaderboard data when the page loads
    loadLeaderboardData();
});