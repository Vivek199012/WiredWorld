# speed-test-cli
A tool for periodically measuring your network's speed and posting it to a firebase database

# Installation & Usage

1. Clone this repository.
2. Run `npm install`
3. Add a file at the root called admin-key.json (generate it at the url https://console.firebase.google.com/u/0/project/[your-project-here]/settings/serviceaccounts/adminsdk).
4. Paste your admin key JSON into the file your created.
5. Open a terminal in the cloned folder.
6. Run `node index.js`

As long as the process is running, the process wil test your internet speed using Ookla speed test every 5 minutes. To change this interval, change the milliseconds on line 28 of index.js.
