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
            }, (err) => {
                console.error('Realtime leaderboard error:', err);
                showErrorState('Error loading donor data');
            });
        } catch (e) {
            console.error('Failed to initialize realtime leaderboard:', e);
            showErrorState('Error loading donor data');
        }
    }

    showLoadingState();
    setupRealtimeLeaderboard();
});
