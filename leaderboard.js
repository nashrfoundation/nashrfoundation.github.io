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
                    <td>₨ ${Number((entry.total_amount != null ? entry.total_amount : entry.amount) || 0).toLocaleString()}</td>
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
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

            const supabaseConfig = {
                url: 'https://jtuhnndwhotxjjolwcuz.supabase.co',
                anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dWhubmR3aG90eGpqb2x3Y3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjU3MDEsImV4cCI6MjA3MjA0MTcwMX0.HJhOCxGDgDERcBfdgBQJsiGoaev5RAtX819eWuMGkhc'
            };

            const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

            // Initial fetch
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('total_amount', { ascending: false })
                .limit(50);

            if (error) {
                throw error;
            }

            // Update ranks based on amount order
            const sortedData = (data || []).map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));

            // Update table with initial data
            requestIdleCallback(() => {
                updateTable(sortedData);
            });
            
            isInitialized = true;

            // Set up real-time subscription
            const subscription = supabase
                .channel('leaderboard-changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'leaderboard' },
                    (payload) => {
                        console.log('Leaderboard change detected:', payload);
                        // Refresh data when changes occur
                        fetchAndUpdateData();
                    }
                )
                .subscribe();

            // Function to fetch and update data
            async function fetchAndUpdateData() {
                try {
                    const { data: newData, error } = await supabase
                        .from('leaderboard')
                        .select('*')
                        .order('total_amount', { ascending: false })
                        .limit(50);

                    if (error) {
                        throw error;
                    }

                    // Update ranks based on amount order
                    const sortedData = (newData || []).map((entry, index) => ({
                        ...entry,
                        rank: index + 1
                    }));

                    requestIdleCallback(() => {
                        updateTable(sortedData);
                    });
                } catch (err) {
                    console.error('Failed to fetch updated data:', err);
                }
            }

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

