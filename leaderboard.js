document.addEventListener('DOMContentLoaded', function() {
    function showLoadingState() {
        const tableBody = document.querySelector('#leaderboard-data');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="3" class="loading-state">Loading donor data...</td></tr>';
        }
    }

    function showErrorState(message) {
        const tableBody = document.querySelector('#leaderboard-data');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="3" class="error-state">${message}</td></tr>`;
        }
    }

    async function setupRealtimeLeaderboard() {
        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { getFirestore, collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

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

            const tableBody = document.querySelector('#leaderboard-data');
            if (!tableBody) return;

            onSnapshot(collection(db, 'leaderboard'), (snapshot) => {
                const data = snapshot.docs.map(d => d.data()).filter(Boolean);
                data.sort((a,b) => (a.rank||9999) - (b.rank||9999));
                tableBody.innerHTML = '';
                data.forEach(entry => {
                    const row = document.createElement('tr');
                    const rankCell = document.createElement('td');
                    rankCell.textContent = String(entry.rank).padStart(2, '0');
                    const nameCell = document.createElement('td');
                    nameCell.textContent = entry.name;
                    const amountCell = document.createElement('td');
                    amountCell.textContent = '₨ ' + Number(entry.amount||0).toLocaleString();
                    row.appendChild(rankCell);
                    row.appendChild(nameCell);
                    row.appendChild(amountCell);
                    tableBody.appendChild(row);
                });
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="3" class="loading-state">No donors yet</td></tr>';
                }
            }, async (err) => {
                console.error('Realtime leaderboard error:', err);
                // Fallback to CSV if Firestore is not accessible
                await fallbackToCsv();
            });
        } catch (e) {
            console.error('Failed to initialize realtime leaderboard:', e);
            // Fallback to CSV if Firestore init fails
            await fallbackToCsv();
        }
    }

    async function fallbackToCsv() {
        try {
            const res = await fetch('leaderboard.csv', { cache: 'no-store' });
            if (!res.ok) throw new Error('CSV fetch failed');
            const text = await res.text();
            const rows = text.trim().split('\n');
            const tableBody = document.querySelector('#leaderboard-data');
            if (!tableBody) return;
            tableBody.innerHTML = '';
            for (let i = 1; i < rows.length; i++) {
                const line = rows[i];
                if (!line) continue;
                const cells = line.split(',');
                if (cells.length >= 3) {
                    const tr = document.createElement('tr');
                    const rankTd = document.createElement('td'); rankTd.textContent = cells[0].trim();
                    const nameTd = document.createElement('td'); nameTd.textContent = cells[1].trim();
                    const amountTd = document.createElement('td'); amountTd.textContent = '₨ ' + cells[2].trim().replace(/,/g, '');
                    tr.appendChild(rankTd); tr.appendChild(nameTd); tr.appendChild(amountTd);
                    tableBody.appendChild(tr);
                }
            }
            if (!tableBody.children.length) {
                showErrorState('No donor data available');
            }
        } catch (err) {
            console.error('CSV fallback failed:', err);
            showErrorState('Error loading donor data');
        }
    }

    showLoadingState();
    setupRealtimeLeaderboard();
});
