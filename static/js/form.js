import { LogEntry } from './logEntry.js';

// form.js should use an existing LogEntry instance if one exists
export class EntryForm {
    constructor() {
        if (!window.logEntryInstance) {
            window.logEntryInstance = new LogEntry();
        }
        this.logEntry = window.logEntryInstance;
    }
}
