import { KeyboardModifiersState } from "@src/common/types";
import BaseManager from "../BaseManager";

/*
ELECTRON KEYBOARD MANAGER listens to keyboard interactions between  windows that might not get caught on an individual window.
*/
export default class ElectronKeyboardManager extends BaseManager {
  private keyboardModifiersState: KeyboardModifiersState = {
    metaKey: false,
  };

  constructor() {
    super();
  }

  /*
  SECTION: Keyboard modifiers
  */

  handleElectronInputKeyboardModifiers = (electronInput: Electron.Input) => {
    if (electronInput.type === "keyUp") {
      if (electronInput.key === "Meta") {
        this.keyboardModifiersState.metaKey = false;
      }
    }
    if (electronInput.type === "keyDown") {
      if (electronInput.key === "Meta") {
        this.keyboardModifiersState.metaKey = true;
      }
    }
  };

  getKeyboardModifiersState() {
    return this.keyboardModifiersState;
  }
}
