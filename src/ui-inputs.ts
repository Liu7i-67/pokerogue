import Phaser from "phaser";
import {Mode} from "./ui/ui";
import {InputsController} from "./inputs-controller";
import MessageUiHandler from "./ui/message-ui-handler";
import StarterSelectUiHandler from "./ui/starter-select-ui-handler";
import {Setting, SettingKeys, settingIndex} from "./system/settings/settings";
import SettingsUiHandler from "./ui/settings/settings-ui-handler";
import {Button} from "#enums/buttons";
import SettingsGamepadUiHandler from "./ui/settings/settings-gamepad-ui-handler";
import SettingsKeyboardUiHandler from "#app/ui/settings/settings-keyboard-ui-handler";
import BattleScene from "./battle-scene";
import SettingsDisplayUiHandler from "./ui/settings/settings-display-ui-handler";
import SettingsAudioUiHandler from "./ui/settings/settings-audio-ui-handler";

type ActionKeys = Record<Button, () => void>;

export class UiInputs {
  private scene: BattleScene;
  private events: Phaser.Events.EventEmitter;
  private inputsController: InputsController;

  constructor(scene: BattleScene, inputsController: InputsController) {
    this.scene = scene;
    this.inputsController = inputsController;
    this.init();
  }

  // 设置事件监听器并调用 listenInputs 方法。
  init(): void {
    this.events = this.inputsController.events;
    this.listenInputs();
  }

  // 检测输入方法（键盘、触屏或游戏手柄），并更新 scene.inputMethod。
  detectInputMethod(evt): void {
    if (evt.controller_type === "keyboard") {
      //if the touch property is present and defined, then this is a simulated keyboard event from the touch screen
      if (evt.hasOwnProperty("isTouch") && evt.isTouch) {
        this.scene.inputMethod = "touch";
      } else {
        this.scene.inputMethod = "keyboard";
      }
    } else if (evt.controller_type === "gamepad") {
      this.scene.inputMethod = "gamepad";
    }
  }

  // 监听 input_down 和 input_up 事件，并调用相应的处理方法。
  listenInputs(): void {
    this.events.on("input_down", (event) => {
      this.detectInputMethod(event);

      const actions = this.getActionsKeyDown();
      if (!actions.hasOwnProperty(event.button)) {
        return;
      }
      actions[event.button]();
    }, this);

    this.events.on("input_up", (event) => {
      const actions = this.getActionsKeyUp();
      if (!actions.hasOwnProperty(event.button)) {
        return;
      }
      actions[event.button]();
    }, this);
  }

  //  根据输入成功与否，决定是否触发震动。
  doVibration(inputSuccess: boolean, vibrationLength: number): void {
    if (inputSuccess && this.scene.enableVibration && typeof navigator.vibrate !== "undefined") {
      navigator.vibrate(vibrationLength);
    }
  }

  // 返回一个包含按钮动作的对象，分别用于按下和释放按键的处理。
  getActionsKeyDown(): ActionKeys {
    const actions: ActionKeys = {
      [Button.UP]:              () => this.buttonDirection(Button.UP),
      [Button.DOWN]:            () => this.buttonDirection(Button.DOWN),
      [Button.LEFT]:            () => this.buttonDirection(Button.LEFT),
      [Button.RIGHT]:           () => this.buttonDirection(Button.RIGHT),
      [Button.SUBMIT]:          () => this.buttonTouch(),
      [Button.ACTION]:          () => this.buttonAb(Button.ACTION),
      [Button.CANCEL]:          () => this.buttonAb(Button.CANCEL),
      [Button.MENU]:            () => this.buttonMenu(),
      [Button.STATS]:           () => this.buttonStats(true),
      [Button.CYCLE_SHINY]:     () => this.buttonCycleOption(Button.CYCLE_SHINY),
      [Button.CYCLE_FORM]:      () => this.buttonCycleOption(Button.CYCLE_FORM),
      [Button.CYCLE_GENDER]:    () => this.buttonCycleOption(Button.CYCLE_GENDER),
      [Button.CYCLE_ABILITY]:   () => this.buttonCycleOption(Button.CYCLE_ABILITY),
      [Button.CYCLE_NATURE]:    () => this.buttonCycleOption(Button.CYCLE_NATURE),
      [Button.V]:               () => this.buttonCycleOption(Button.V),
      [Button.SPEED_UP]:        () => this.buttonSpeedChange(),
      [Button.SLOW_DOWN]:       () => this.buttonSpeedChange(false),
    };
    return actions;
  }

  getActionsKeyUp(): ActionKeys {
    const actions: ActionKeys = {
      [Button.UP]:              () => undefined,
      [Button.DOWN]:            () => undefined,
      [Button.LEFT]:            () => undefined,
      [Button.RIGHT]:           () => undefined,
      [Button.SUBMIT]:          () => undefined,
      [Button.ACTION]:          () => undefined,
      [Button.CANCEL]:          () => undefined,
      [Button.MENU]:            () => undefined,
      [Button.STATS]:           () => this.buttonStats(false),
      [Button.CYCLE_SHINY]:     () => undefined,
      [Button.CYCLE_FORM]:      () => undefined,
      [Button.CYCLE_GENDER]:    () => undefined,
      [Button.CYCLE_ABILITY]:   () => undefined,
      [Button.CYCLE_NATURE]:    () => undefined,
      [Button.V]:               () => this.buttonInfo(false),
      [Button.SPEED_UP]:        () => undefined,
      [Button.SLOW_DOWN]:       () => undefined,
    };
    return actions;
  }

  // buttonDirection: 处理方向键的输入，并触发震动。
  buttonDirection(direction: Button): void {
    const inputSuccess = this.scene.ui.processInput(direction);
    const vibrationLength = 5;
    this.doVibration(inputSuccess, vibrationLength);
  }

  //  处理 ACTION 和 CANCEL 按钮的输入。
  buttonAb(button: Button): void {
    this.scene.ui.processInput(button);
  }

  // 处理触屏输入，调用 SUBMIT 或 ACTION 按钮的处理方法。
  buttonTouch(): void {
    this.scene.ui.processInput(Button.SUBMIT) || this.scene.ui.processInput(Button.ACTION);
  }


  // 处理 STATS 按钮的输入，切换统计信息的显示。
  buttonStats(pressed: boolean = true): void {
    // allow access to Button.STATS as a toggle for other elements
    for (const t of this.scene.getInfoToggles(true)) {
      t.toggleInfo(pressed);
    }
    // handle normal pokemon battle ui
    for (const p of this.scene.getField().filter(p => p?.isActive(true))) {
      p.toggleStats(pressed);
    }
  }

  // 处理信息显示的输入。
  buttonInfo(pressed: boolean = true): void {
    if (this.scene.showMovesetFlyout ) {
      for (const p of this.scene.getField().filter(p => p?.isActive(true))) {
        p.toggleFlyout(pressed);
      }
    }

    if (this.scene.showArenaFlyout) {
      this.scene.ui.processInfoButton(pressed);
    }
  }

  // 处理菜单按钮的输入，切换菜单模式。
  buttonMenu(): void {
    if (this.scene.disableMenu) {
      return;
    }
    switch (this.scene.ui?.getMode()) {
    case Mode.MESSAGE:
      if (!(this.scene.ui.getHandler() as MessageUiHandler).pendingPrompt) {
        return;
      }
    case Mode.TITLE:
    case Mode.COMMAND:
    case Mode.MODIFIER_SELECT:
      this.scene.ui.setOverlayMode(Mode.MENU);
      break;
    case Mode.STARTER_SELECT:
      this.buttonTouch();
      break;
    case Mode.MENU:
      this.scene.ui.revertMode();
      this.scene.playSound("select");
      break;
    default:
      return;
    }
  }

  // 处理循环选项按钮的输入，适用于特定的 UI 处理程序。
  buttonCycleOption(button: Button): void {
    const whitelist = [StarterSelectUiHandler, SettingsUiHandler, SettingsDisplayUiHandler, SettingsAudioUiHandler, SettingsGamepadUiHandler, SettingsKeyboardUiHandler];
    const uiHandler = this.scene.ui?.getHandler();
    if (whitelist.some(handler => uiHandler instanceof handler)) {
      this.scene.ui.processInput(button);
    } else if (button === Button.V) {
      this.buttonInfo(true);
    }
  }

  // 处理游戏速度的调整。
  buttonSpeedChange(up = true): void {
    const settingGameSpeed = settingIndex(SettingKeys.Game_Speed);
    if (up && this.scene.gameSpeed < 5) {
      this.scene.gameData.saveSetting(SettingKeys.Game_Speed, Setting[settingGameSpeed].options.findIndex((item) => item.label === `${this.scene.gameSpeed}x`) + 1);
      if (this.scene.ui?.getMode() === Mode.SETTINGS) {
        (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
      }
    } else if (!up && this.scene.gameSpeed > 1) {
      this.scene.gameData.saveSetting(SettingKeys.Game_Speed, Math.max(Setting[settingGameSpeed].options.findIndex((item) => item.label === `${this.scene.gameSpeed}x`) - 1, 0));
      if (this.scene.ui?.getMode() === Mode.SETTINGS) {
        (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
      }
    }
  }

}
