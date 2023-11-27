# Ideas

## Note writing experience

- Add VIM bindings
- Markdown?
- Add tables
- Update app if note file edited
  - Would need some efficient way to scan note files when the overlay is opened
  - Perhaps keep track of last edited times?
  - A simple implementation will be to scan everything every single time, but it might affect performance?
- Syncing across devices
- Add metadata in file while note taking
  - Can be how we determine which folder to save to if we add that in
- Hide or minimize search window
- Multi display compatibility

## Search experience

- Utilize fuse.js sortFn and matches
  - Look into this https://www.fusejs.io/api/options.html#sortfn
  - Fuse.js already does compute matches indices natively, went with custom implementation due weird mapping issues when trying to implement it first time around.
  - We can also use the sortfn in the options instead of using our own sort after the fuse.js query.
- Markdown display for search results
  - Also limit search result height not word count
- Sort chunks within result displays
- When a result item is clicked in search results, highlight queries in editing and also scroll to that particular chunk
  - Can do this when we implement cmd+f or search in write window
- More dynamic search algo
  - Use titles to rank
  - Tags? White matter?
- Paginate recent notes
- Move select index based on context menu and clicks

## Organization

- Allow folders and reading all the files in a folder
- Easily switch between note folders?
  - Wondering if we can do something like "right click > open in Jotter" on folders?
  - Jotter files?

## Settings

- Allow for changing of shortcuts, both global and local

## Code organization

- Make ModeManager more object oriented, separate different modes into classes with callable functions?

## Dev

- Add jest runner groups
  - https://www.npmjs.com/package/jest-runner-groups
- Make testing intro CX easier
- More tests in general
- Automate publishing downloadable packages
- Allow for both local jotter instance and dev jotter instance to run, maybe with different shortcuts for entry?
