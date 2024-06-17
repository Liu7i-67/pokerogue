import BattleScene from "../../battle-scene";
import { Setting, SettingType } from "../../system/settings/settings";
import { Mode } from "../ui";
import AbstractSettingsUiHandler from "./abstract-settings-ui-handler";
import i18next from "i18next";

export default class SettingsUiHandler extends AbstractSettingsUiHandler {
  /**
   * Creates an instance of SettingsGamepadUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode, optional.
   */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.title = i18next.t("setting:general");
    this.settings = Setting.filter((s) => s.type === SettingType.GENERAL);
    this.localStorageKey = "settings";
  }
}
