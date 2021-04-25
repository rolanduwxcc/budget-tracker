let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_entry', { autoIncrement: true });
};


request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
        //upload offline budget data
        uploadEntry();
    }
};


request.onerror = function(event) {
    console.log(event.target.errorCode);
};


function saveRecord(record) {
    const transaction = db.transaction(['new_entry'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_entry');
    budgetObjectStore.add(record);
}

function uploadEntry() {
    const transaction = db.transaction('new_entry', 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_entry');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Concept-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_entry'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_entry');
                    budgetObjectStore.clear();

                    alert('All debits and credits are submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
};


window.addEventListener('online', uploadEntry);