document.addEventListener('DOMContentLoaded', function() {
    // Function to load the leaderboard data from CSV
    function loadLeaderboardData() {
        fetch('leaderboard.csv')  // Changed from 'data/leaderboard.csv' to 'leaderboard.csv'
            .then(response => response.text())
            .then(data => {
                // Parse CSV data
                const rows = data.split('\n');
                const headers = rows[0].split(',');
                const tableBody = document.querySelector('.leaderboard-table tbody');
                
                // Clear existing table data
                tableBody.innerHTML = '';
                
                // Add data rows
                for (let i = 1; i < rows.length; i++) {
                    if (rows[i].trim() === '') continue; // Skip empty rows
                    
                    const cells = rows[i].split(',');
                    const row = document.createElement('tr');
                    
                    // Create cells for each column
                    for (let j = 0; j < cells.length; j++) {
                        const cell = document.createElement('td');
                        
                        // Format amount with currency symbol if it's the amount column
                        if (j === 2) {
                            cell.textContent = '₨ ' + cells[j];
                        } else {
                            cell.textContent = cells[j];
                        }
                        
                        row.appendChild(cell);
                    }
                    
                    tableBody.appendChild(row);
                }
            })
            .catch(error => {
                console.error('Error loading leaderboard data:', error);
                // Display a fallback message if data can't be loaded
                const tableBody = document.querySelector('.leaderboard-table tbody');
                tableBody.innerHTML = '<tr><td colspan="3">Leaderboard data is currently unavailable. Please check back later.</td></tr>';
            });
    }
    
    // Load the leaderboard data when the page loads
    loadLeaderboardData();
});
