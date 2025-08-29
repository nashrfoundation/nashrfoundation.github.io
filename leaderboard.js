// Optimized Leaderboard JavaScript for Nashr Foundation
// Performance optimized with better caching and reduced DOM manipulations

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements for better performance
    const tableBody = document.querySelector('#leaderboard-data');
    let isInitialized = false;
    
    // Use requestIdleCallback for non-critical operations
    const requestIdleCallback = window.requestIdleCallback || function(cb) {
        return setTimeout(cb, 1);
    };

    function showLoadingState() {
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="3" class="loading-state">Loading donor data...</td></tr>';
        }
    }

    function showErrorState(message) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="3" class="error-state">${message}</td></tr>`;
        }
    }

    // Optimized function to update table with minimal DOM manipulation
    function updateTable(data) {
        if (!tableBody) return;
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        if (data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="loading-state">No donors yet</td>';
            fragment.appendChild(row);
        } else {
            data.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${String(entry.rank || 9999).padStart(2, '0')}</td>
                    <td>${entry.name || 'Anonymous'}</td>
                    <td>₨ ${Number(entry.amount || 0).toLocaleString()}</td>
                `;
                fragment.appendChild(row);
            });
        }
        
        // Single DOM update
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
    }

    async function setupRealtimeLeaderboard() {
        try {
            // Dynamic imports for better performance
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { getFirestore, collection, onSnapshot, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

            const firebaseConfig = {
                apiKey: "AIzaSyBw9khGmocvn0bqGDOgumWDwUhQk1JuOMM",
                authDomain: "nashr-foundation-c3860.firebaseapp.com",
                projectId: "nashr-foundation-c3860",
                storageBucket: "nashr-foundation-c3860.firebasestorage.app",
                messagingSenderId: "76161626733",
                appId: "1:76161626733:web:cbc498485deaddd60bc564",
                measurementId: "G-Y0WSNQK3MW"
            };

            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);

            // Optimized query with ordering and limiting
            const leaderboardQuery = query(
                collection(db, 'leaderboard'),
                orderBy('rank', 'asc'),
                limit(50)
            );

            onSnapshot(leaderboardQuery, (snapshot) => {
                const data = snapshot.docs
                    .map(d => d.data())
                    .filter(Boolean)
                    .sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
                
                // Use requestIdleCallback for non-critical updates
                requestIdleCallback(() => {
                    updateTable(data);
                });
                
                isInitialized = true;
            }, async (err) => {
                console.error('Realtime leaderboard error:', err);
                if (!isInitialized) {
                    await fallbackToCsv();
                }
            });
        } catch (e) {
            console.error('Failed to initialize realtime leaderboard:', e);
            await fallbackToCsv();
        }
    }

    async function fallbackToCsv() {
        try {
            // Use cache-first strategy for CSV
            const res = await fetch('leaderboard.csv', { 
                cache: 'force-cache',
                headers: {
                    'Cache-Control': 'max-age=3600'
                }
            });
            
            if (!res.ok) throw new Error('CSV fetch failed');
            
            const text = await res.text();
            const rows = text.trim().split('\n');
            const data = [];
            
            // Parse CSV data
            for (let i = 1; i < rows.length; i++) {
                const line = rows[i];
                if (!line) continue;
                
                const cells = line.split(',');
                if (cells.length >= 3) {
                    data.push({
                        rank: parseInt(cells[0].trim()) || 9999,
                        name: cells[1].trim(),
                        amount: cells[2].trim().replace(/,/g, '')
                    });
                }
            }
            
            // Sort data
            data.sort((a, b) => a.rank - b.rank);
            
            // Update table in idle time
            requestIdleCallback(() => {
                updateTable(data);
            });
            
        } catch (err) {
            console.error('CSV fallback failed:', err);
            showErrorState('Error loading donor data');
        }
    }

    // Initialize with loading state
    showLoadingState();
    
    // Start realtime leaderboard setup
    setupRealtimeLeaderboard();
});

