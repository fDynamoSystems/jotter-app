# Known bugs

- Undo does not reset when we replace content of a write window
- System menus, mac search, are shown below windows
- Saving to memory does not replicate focus history 1 to 1
- If the app goes to closed mode in full screen, then the full screen mode is removed, it causes the window to remain on one desktop window
- Trying to port this to windows has a lot of problems:
  - Main keyboard shortcut fails since alt + ctrl + N is used to open narrator settings
  - Hiding windows aren't a thing
  - Our close buttons aren't working
