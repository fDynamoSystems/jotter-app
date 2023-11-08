# Interactions

Goes over how users interact with the app

## Search Window

### Access

- SEARCH_ENTRY shortcut (opt+cmd+f)
- SEARCH_NOTES shortcut when the app is open (shift+cmd+f)
- Clicks when app is open
- Tray menu "search notes"

### Interactions

- If the user clicks on search input, it focuses
  - If the user uses arrow keys when the search input is empty, or when the cursor is at the start or end, mimics arrow key behavior for selecting notes
  - If the user presses enter, unfocuses from search input
  - Typing anything to the search input automatically queries notes

* If the user clicks on a result item...
  - Default behavior is to override current write window
  - With cmd key held down, open new window
* If the user right clicks on a result item...
  - Brings up a context menu to edit or delete the note
* When search input is not focused...
  - Users can use arrow keys to select different result items
    - Hitting enter when a result item is selected opens it in the current write window
    - Hitting cmd + enter opens it in a new write window
    - Hitting delete prompts deletion of the note
  - Any alphanumerical input will automatically focus on the search input and edit it
* When nothing is queried, default to most recently modified notes
  - Hardcoded limit of 100 on display

## Write Window

### Access

- MAIN_ENTRY shortcut (opt + cmd + n)
- Clicks when app is open

TO FILL
