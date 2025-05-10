export class EntryViewer {
    constructor() {
        this.loadEntry();
    }

    loadEntry() {
        const entryData = JSON.parse(document.getElementById('entryData').value);
        this.displayEntry(entryData);
    }

    displayEntry(entry) {
        document.getElementById('entryTitle').textContent = entry.title;
        document.getElementById('entryProject').textContent = `Project: ${entry.project_name}`;
        document.getElementById('entryDeveloper').textContent = `Developer: ${entry.developer_tag}`;
        document.getElementById('entryTimestamp').textContent = new Date(entry.timestamp).toLocaleString();
        document.getElementById('entryContent').textContent = entry.content;
        document.getElementById('entryTimeWorked').textContent = `Time worked: ${entry.time_worked} minutes`;
        document.getElementById('entryStartTime').textContent = `Started: ${new Date(entry.start_time).toLocaleString()}`;
        document.getElementById('entryEndTime').textContent = `Ended: ${new Date(entry.end_time).toLocaleString()}`;
    }
}