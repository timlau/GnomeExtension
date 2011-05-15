const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const APPMENU_ICON_SIZE = 22;

function MyPopupMenuItem() {
   this._init.apply(this, arguments);
}

MyPopupMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(icon, text, menu_icon_first, params) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

        this.label = new St.Label({ text: text });

        if (menu_icon_first) {
            this.box = new St.BoxLayout();
            this.box.add(icon);
            this.box.add(this.label);
            this.addActor(this.box);
        } else {
            this.addActor(this.label);
            this.addActor(icon);
        }
    }

};

function ApplicationsButton() {
   this._init.apply(this, arguments);
}

ApplicationsButton.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function(mode) {
        PanelMenu.Button.prototype._init.call(this, 0.0);

        this._icon = new St.Icon({ icon_name: 'fedora-logo-icon',
                                   icon_type: St.IconType.FULLCOLOR,
                                   icon_size: Main.panel.button.height });
        this.actor.set_child(this._icon);

        this._appSys = Shell.AppSystem.get_default();
        this._categories = this._appSys.get_sections();
        this._menuIconFirst = mode;

        this._display();

        this._appSys.connect('installed-changed', Lang.bind(this, function() {
            Main.queueDeferredWork(this._reDisplay);
        }));

        // add immediately after hotspot
        Main.panel._leftBox.insert_actor(this.actor, 1);
        Main.panel._menus.addMenu(this.menu);
    },

   _display: function() {
        this.appItems = [];

        for (let id = 0; id < this._categories.length; id++) {
            this.appItems[this._categories[id]] = new PopupMenu.PopupSubMenuMenuItem(this._categories[id]);
            this.menu.addMenuItem(this.appItems[this._categories[id]]);
        }

        let appInfos = this._appSys.get_flattened_apps().filter(function(app) {
            return !app.get_is_nodisplay();
        });

        for (let appid = appInfos.length-1; appid >= 0; appid--) {
            let appInfo = appInfos[appid];
            let icon = appInfo.create_icon_texture(APPMENU_ICON_SIZE);

            let appName = new MyPopupMenuItem(icon, appInfo.get_name(), this._menuIconFirst);
            // let appName = new PopupMenu.PopupMenuItem(appInfo.get_name());
            appName._appInfo = appInfo;

            this.appItems[appInfo.get_section()].menu.addMenuItem(appName);
            appName.connect('activate', function(actor,event) {
                let id = actor._appInfo.get_id();
                Shell.AppSystem.get_default().get_app(id).activate(-1);
            });
       }

    },

    _redisplay: function() {
        for (let id = 0; id < this._categories.length; id++) {
            this.appItems[this._categories[id]].menu.destroy();
        }
        this._display();
    }
};

function main(extensionMeta) {

    let userExtensionLocalePath = extensionMeta.path + '/locale';
    Gettext.bindtextdomain("applications_button", userExtensionLocalePath);
    Gettext.textdomain("applications_button");

    new ApplicationsButton(false);
}
