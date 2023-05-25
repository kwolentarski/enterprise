import { utils } from '../../utils/utils';

import '../button/button.jquery';
import '../dropdown/dropdown.jquery';

import {
  buttonTemplate,
  dropdownTemplate,
  iconTemplate,
  roleTemplate,
  isValidDisplayMode,
  MODULE_NAV_DISPLAY_MODES,
  SWITCHER_ICON_HTML,
  setDisplayMode
} from './module-nav.common';

// Settings and Options
const COMPONENT_NAME = 'modulenavswitcher';

const MODULE_NAV_SWITCHER_DEFAULTS = {
  displayMode: MODULE_NAV_DISPLAY_MODES[0],
  icon: () => SWITCHER_ICON_HTML,
  roles: []
};

/**
 * Module Nav Switcher - Controls top-level navigation for an application
 * @class ModuleNavSwitcher
 * @param {string} element The plugin element for the constuctor
 * @param {string} [settings] The settings element.
 */
function ModuleNavSwitcher(element, settings) {
  this.settings = utils.mergeSettings(element, settings, MODULE_NAV_SWITCHER_DEFAULTS);
  this.element = $(element);
  this.init();
}

// Plugin Methods
ModuleNavSwitcher.prototype = {

  /** Reference to the parent accordion element, if present */
  get accordionEl() {
    return this.element.parents('.accordion').first()?.[0];
  },

  /** Reference to the parent accordion API, if present */
  get accordionAPI() {
    return this.accordionEl ? $(this.accordionEl).data('accordion') : undefined;
  },

  /** Reference to the Module Button API, if present */
  get moduleButtonAPI() {
    return this.moduleButtonEl ? $(this.moduleButtonEl).data('button') : undefined;
  },

  /** Reference to the Module Switcher Dropdown API, if present */
  get roleDropdownAPI() {
    return this.roleDropdownEl ? $(this.roleDropdownEl).data('dropdown') : undefined;
  },

  /**
   * Do initialization, build up and / or add events ect.
   * @returns {object} The Component prototype, useful for chaining.
   */
  init() {
    // Do initialization. Build or Events ect
    return this
      .build()
      .handleEvents();
  },

  /**
   * Add any needed markup to the component.
   * @returns {object} The Component prototype, useful for chaining.
   * @private
   */
  build() {
    // Refs
    this.renderChildComponents();

    // Configure
    this.setDisplayMode(this.settings.displayMode);
    this.setModuleButtonIcon();
    if (!$(this.roleDropdownEl).find('option').length) {
      this.renderDropdownOptions(true);
    }

    return this;
  },

  /**
   * Sets up event handlers for this component and its sub-elements.
   * @returns {object} The Component prototype, useful for chaining.
   * @private
   */
  handleEvents() {
    const self = this;

    this.element.on(`updated.${COMPONENT_NAME}`, () => {
      self.updated();
    });

    this.element.on(`keydown.${COMPONENT_NAME}`, (e) => {
      const key = e.key;

      if (key === 'ArrowUp') {
        // console.info('navigate to Module Nav Settings component');
        this.accordionAPI?.prevHeader(this.element);
        return;
      }

      if (key === 'ArrowDown') {
        // console.info('navigate to first accordion item');
        this.accordionAPI?.nextHeader(this.element);
      }
    });

    return this;
  },

  /**
   * Draws important UI elements if they aren't found
   */
  renderChildComponents() {
    this.containerEl = this.element.parents('.module-nav-container')[0];

    // Module Button
    this.moduleButtonContainerEl = this.element[0].querySelector('.module-nav-section.module-btn');
    this.moduleButtonEl = this.element[0].querySelector('.module-btn button');
    if (!this.moduleButtonContainerEl || !this.moduleButtonEl) {
      this.element[0].insertAdjacentHTML('afterbegin', buttonTemplate());
      this.moduleButtonContainerEl = this.element[0].querySelector('.module-nav-section.module-btn');
      this.moduleButtonEl = this.moduleButtonContainerEl.querySelector('button');
    }
    $(this.moduleButtonEl).button({
      ripple: false
    });

    // Dropdown for Role Switcher
    this.roleDropdownContainerEl = this.element[0].querySelector('.module-nav-section.role-dropdown');
    this.roleDropdownEl = $(this.roleDropdownContainerEl).find('.dropdown');
    if (!this.roleDropdownContainerEl || !this.roleDropdownEl) {
      this.element[0].insertAdjacentHTML('beforeend', dropdownTemplate());
      this.roleDropdownContainerEl = this.element[0].querySelector('.module-nav-section.role-dropdown');
      this.roleDropdownEl = $(this.roleDropdownContainerEl).find('.dropdown');
    }
    if (!$(this.roleDropdownEl).find('option').length) {
      this.renderDropdownOptions();
    }
    $(this.roleDropdownEl).dropdown({
      cssClass: 'role-dropdown',
      dropdownIcon: 'expand-all',
      extraListWrapper: true,
      width: 'parent',
      widthTarget: '.module-nav-switcher'
    });
  },

  /**
   * @param {boolean} doUpdate true if the Dropdown API should update
   * @private
   */
  renderDropdownOptions(doUpdate = false) {
    if (Array.isArray(this.settings.roles) && this.settings.roles.length) this.setRoles(this.settings.roles, doUpdate);
  },

  /**
   * Configures the Module Nav Switcher's display mode.
   * @param {string} val desired display mode
   * @returns {void}
   */
  setDisplayMode(val) {
    if (!isValidDisplayMode(val)) return;

    if (this.settings.displayMode !== val) this.settings.displayMode = val;
    setDisplayMode(val, this.element[0]);
  },

  /**
   * Configures the Module Button's icon
   * @returns {void}
   */
  setModuleButtonIcon() {
    let iconHTML = '';

    switch(typeof this.settings.icon) {
      case 'function':
        iconHTML = this.settings.icon(this);
        break;
      case 'string':
        iconHTML = iconTemplate(this.settings.icon);
        break;
      default:
        break;
    }

    // if Icon HTML exists, replace the current one
    if (iconHTML.length) {
      const svgEl = this.moduleButtonEl.querySelector('svg');
      svgEl?.remove();
      this.moduleButtonEl.insertAdjacentHTML('afterbegin', iconHTML);
    }
  },

  /**
   * @param {object[]} val contains Module Switcher Role Dropdown entries
   * @param {boolean} doUpdate if true, runs the Dropdown's `updated()` method
   */
  setRoles(val, doUpdate = false) {
    if (!Array.isArray(val) || !this.roleDropdownEl) return;

    let newRoles = '';
    this.roleDropdownEl.innerHTML = '';

    if (val.length) {
      val.forEach((entry) => {
        newRoles += roleTemplate(entry.value, entry.text, entry.icon, entry.iconColor);
      });
    }

    if (newRoles.length) {
      this.roleDropdownEl.insertAdjacentHTML('afterbegin', newRoles);
      if (doUpdate) $(this.roleDropdownEl).updated();
    }
  },

  /**
   * Handle updated settings and values.
   * @param {object} [settings] if provided, updates module nav settings
   * @returns {object} chainable API
   */
  updated(settings) {
    if (settings) {
      this.settings = utils.mergeSettings(this.element[0], settings, this.settings);
    }
    return this
      .teardown()
      .init();
  },

  /**
   * Simple Teardown - remove events & rebuildable markup.
   * @returns {object} The Component prototype, useful for chaining.
   */
  teardown() {
    this.element.off(`updated.${COMPONENT_NAME}`);

    if (this.moduleButtonEl) {
      $(this.moduleButtonEl).data('button')?.destroy();
      this.moduleButtonEl = null;
      this.moduleButtonContainerEl = null;
    }

    if (this.roleDropdownEl) {
      $(this.roleDropdownEl).data('dropdown')?.destroy();
      this.roleDropdownEl = null;
      this.roleDropdownContainerEl = null;
    }

    return this;
  },

  /**
   * Destroy - Remove added markup and events.
   */
  destroy() {
    this.teardown();
    $.removeData(this.element[0], COMPONENT_NAME);
  }
};

export { ModuleNavSwitcher, COMPONENT_NAME };
