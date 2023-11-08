# Development

## Getting things running

### Prerequisites
1. Have node v16 installed and either `npm` or `yarn`
2. xcode (for building on Mac)

### Development setup
1. `git clone https://github.com/fDynamoSystems/jotter-app.git`
2. `cd jotter-app`
3. `npm install` or `yarn install`
 	- If you get an "Invalid active developer path" error, run `xcode-select install`  
4. `npm run dev` or `yarn dev` to start local development instance of the app

#### Notes
- If any changes are made in the `renderer` side / react components, you need to reload the corresponding window.
  - `Cmd+R`
  - Doing this might break some systems, i.e unsync write windows from window manager states
- If any changes are made in the `main` side, you need to completely close the app and run `npm run dev` again.
- You can open the devtools inspector on a window using `Option+Cmd+I`
	- Need to unfocus from the text area in the write window to use this

## Building from source
1. Follow development setup
2. Run `npm run build-make` or `yarn build-make`

### Dependencies
- Check out [jotter-fuse](https://github.com/fDynamoSystems/jotter-fuse) for the fork of the text search library used for search

## What should I contribute?
Anything you want. Check out `Ideas.md` and `Known bugs.md` for inspiration.

## How to contribute?
Make a pull request. Add tests before that. No specific template as of now.
