//
//   ThemeSelector - Enable selection of custom themes in the GNOME Shell
// 
//   Copyright 2011 Finnbarr P. Murphy (fpm[AT]fpmurphy[DOT]com)
//
//   Portions copyright 2011 Sardem FF7
//
//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
// 
//   This program is distributed WITHOUT ANY WARRANTY; without even the 
//   implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
//   See the GNU General Public License at http://www.gnu.org/licenses/ for 
//   more details.
//
//   Version: 0.9
//

const Main = imports.ui.main;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Clutter = imports.gi.Clutter;
const Pango = imports.gi.Pango;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const FileUtils = imports.misc.fileUtils;
const IconGrid = imports.ui.iconGrid;
const Config = imports.misc.config;
const Gettext = imports.gettext;
const _ = Gettext.gettext;

const GSETTINGS_SCHEMA = 'org.gnome.shell.extensions.user-theme';
const GSETTINGS_THEME_KEY = 'name';

const DEFAULT_THEME = 'Adwaita';
const DEFAULT_THEME_FILE = '/usr/share/gnome-shell/theme/gnome-shell.css';
const DEFAULT_STYLESHEET = 'gnome-shell.css';

const HIGHLIGHT_STYLE = 'border: 2px solid red; border-radius: 8px;';
const THUMBNAIL_WIDTH = 128;
const THUMBNAIL_HEIGHT = 96;


function ThemeBox() { 
    this._init.apply(this, arguments); 
}

ThemeBox.prototype = {
    _init: function(selector, metadata, themeName) {
        this._selector = selector;
        this._metadata = metadata;
        this._thumbnail = null;
        this._highlight = false;

        if ( metadata['name'] == themeName ) { 
           this._highlight = true; 
        }

        let box = new Shell.GenericContainer();
        box.connect("allocate", Lang.bind(this, this._allocate));

        let textureCache = St.TextureCache.get_default();
        let uri = "file://" + metadata['thumbnail'];
        this._thumbnail = new St.Bin({x_fill: true, y_fill: true,
                              x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE,
                              style_class: 'workspace-thumbnails-background',
                              child: textureCache.load_uri_async(uri, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)}); 
        box.add_actor(this._thumbnail);

        this._indicator = new St.Bin({ style_class: 'workspace-thumbnails' });
        box.add_actor(this._indicator);

        this._title = new St.Label({ style_class: 'window-caption',
                          text: metadata['name'] + ' v' + metadata['version'] + _(" by ") + metadata['author'] });
        this._title.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        box.add_actor(this._title);

        let clickable = new St.Button({'reactive': true, 'x_fill': true, 'y_fill': true, 
                                       'y_align': St.Align.MIDDLE }); 
        clickable.set_child(box);
        this.actor = clickable;
        this.actor.themeName = this._metadata['name'];
    },


    _allocate: function(container, box, flags) {
        let childBox = new Clutter.ActorBox();

        // the actual thumbnail
        childBox.x1 = 0;
        childBox.y1 = 0;
        childBox.x2 = this.actor.width;
        childBox.y2 = this.actor.height - 40;
        this._thumbnail.allocate(childBox, flags);

        if ( this._highlight ) {
            this._indicator.set_style(HIGHLIGHT_STYLE);
            this._indicator.allocate(childBox, flags);
        }

        // the thumbnail caption 
        let textPadding = 5;
        childBox.x1 = (this.actor.width - this._title.width)/2;
        childBox.x2 = this.actor.width - childBox.x1;
        childBox.y1 = textPadding + childBox.y2;
        childBox.y2 = this.actor.height - 2*textPadding;    // FPM - fix up
        this._title.allocate(childBox, flags);
    }
};


function ThemeSelector() { 
    this._init.apply(this, arguments);
}

ThemeSelector.prototype = {
    _init: function() {
        this._selector = null;
        this._themes = [];
        
        let _home_dir = GLib.get_home_dir();
        this._themesDirs = [GLib.build_filenamev([_home_dir, '/.themes'])];

        // retrieve the current theme if set
        this._settings = new Gio.Settings({ schema: GSETTINGS_SCHEMA });
        this._currentThemeName = this._settings.get_string(GSETTINGS_THEME_KEY);
        if (this._currentThemeName == '') { 
            this._currentThemeName = DEFAULT_THEME;
        }
        // this._settings.connect("changed::theme", Lang.bind(this, this._themeHasChanged));

        // load the current theme if not default
        let themes = null;
        for ( let i = 0 ; i < this._themesDirs.length ; ++i) {
            themes = this._getThemeMetadata(this._themesDirs[i], themes);
        }
        if (this._currentThemeName != DEFAULT_THEME) {
           this._loadThemeStylesheet(this._currentThemeName);
        }

        this._selector = new Shell.GenericContainer({ name: 'theme-selector' });
        this._selector.connect('allocate', Lang.bind(this, this._tabAllocate));

        Main.overview.viewSelector.addViewTab('theme-selector', _("Themes"), this._selector);
        Main.overview.connect('hidden', Lang.bind(this, function() {
            this._loadThemeStylesheet(this._currentThemeName);
        }));

        this._grid = new Shell.GenericContainer({ 'name': 'themes-grid' });
        this._grid.connect('allocate', Lang.bind(this, this._gridAllocate));
        this._selector.add_actor(this._grid);

        this._createThemeGrid();
    },

    _tabAllocate: function(container, box, flags) {
        let tabNode = this._selector.get_theme_node();
        let tabPadding = tabNode.get_length('padding');
        let childBox = new Clutter.ActorBox();
        childBox.x1 = 0;
        childBox.y1 = 0;
        childBox.x2 = this._selector.width;
        childBox.y2 = this._selector.height;
        this._grid.allocate(childBox, flags);
    },

    _gridAllocate: function(container, box, flags) {
        let primary = global.get_primary_monitor();
        // move these to constants
        let gridSpacing = 10;
        let gridPadding = 25;
        let numColumns = 5;
        let numDrop = 40;

        let w = Math.floor((this._grid.width - ( (numColumns - 1) * gridSpacing + 2 * gridPadding )) / numColumns);
        let h = Math.floor(w * (primary.height / primary.width)) + numDrop; 

        let childBox = new Clutter.ActorBox();
        let children = this._grid.get_children();
        for (let i = 0 ; i < children.length ; ++i) {
            let column = i % numColumns;
            let row = Math.floor(i / numColumns);
            let x = gridPadding + column * w;
            if ( column > 0 ) { x += gridSpacing * column; }
            let y = gridPadding + row * h;
            if ( row > 0 ) { y += gridSpacing * row; }
            childBox.x1 = x;
            childBox.y1 = y;
            childBox.x2 = x + w;
            childBox.y2 = y + h;
            children[i].allocate(childBox, flags);
        }
    },

    _createThemeGrid: function() {
        let children = this._grid.get_children();
        let i;
        for (i = 0 ; i < children.length ; ++i) {
            children[i].destroy();
        }
        for (i = 0 ; i < this._themes.length ; ++i ) {
            this._addThemeBox(this._themes[i]);
        }
    },

    _addThemeBox: function(metadata) {
        let themeBox = new ThemeBox(this, metadata, this._currentThemeName);
        themeBox.actor.connect('clicked', Lang.bind(this, function(actor, event) {
            if ( actor.themeName != this._currentThemeName) {
                this._currentThemeName = actor.themeName;
                this._settings.set_string(GSETTINGS_THEME_KEY, this._currentThemeName);
                this._loadThemeStylesheet(this._currentThemeName);
                this._createThemeGrid();
            }
        }));
        this._grid.add_actor(themeBox.actor);
    },

    _loadThemeStylesheet: function(theme) {
        let themeName = theme;
        let themeFile = DEFAULT_THEME_FILE;

        if ( themeName != DEFAULT_THEME ) {
            for (let i = 0 ; i < this._themes.length ; ++i ) {
                let meta = this._themes[i];
                if ( meta['name'] == themeName ) {
                    let stylesheet = meta['stylesheet'];
                    if ( GLib.file_test(stylesheet, GLib.FileTest.IS_REGULAR) ) {
                        themeFile = stylesheet;
                        break;
                    }
                }
            }
        }

        // set the theme
        if ( themeFile != Main.getThemeStylesheet() ) {
            Main.setThemeStylesheet(themeFile);
            Main.loadTheme();
        }
    },

    _themeHasChanged: function() {
        this._currentThemeName = this._settings.get_string(GSETTINGS_THEME_KEY);
        this._loadThemeStylesheet(this._currentThemeName);
        this._createThemeGrid();
    },

    _getThemeMetadata: function(dirName, themes) {
        let themesDir = Gio.file_new_for_path(dirName);
        let retThemes = ( themes == null ) ? ( [] ) : ( themes );

        if ( themesDir.query_exists(null) ) {
            let children = themesDir.enumerate_children('standard::name', 
                              Gio.FileQueryInfoFlags.NONE, null);
            let file = null;
            while (( file = children.next_file(null) ) != null ) {
                let name = file.get_name();
                if ( retThemes.indexOf(name) > -1 ) { continue; }

                let baseErrorString = _("Theme ") + name + ': ';
                let themeDir = Gio.file_new_for_path(dirName + '/' + name + '/gnome-shell/');

                // first some sanity testing
                let metadataFile = themeDir.get_child('theme.json');
                if (!metadataFile.query_exists(null)) {
                    global.logError(baseErrorString + _("Missing") + " theme.json");
                    continue;
                }
                if ( ! GLib.file_test(metadataFile.get_path(), GLib.FileTest.IS_REGULAR) ) {
                     global.logError(baseErrorString + "theme.json " + _("is not a regular file") );

                     continue;
                }

                // load theme metadata file
                let metadataContents;
                try {
                    metadataContents = Shell.get_file_contents_utf8_sync(metadataFile.get_path());
                } catch (e) {
                    global.logError(baseErrorString + _("Failed to load") + " theme.json: " + e);
                    continue;
                }

                // parse theme metadata file
                let shellThemeMeta;
                let meta;
                try {
                    shellThemeMeta = JSON.parse(metadataContents);
                    meta = shellThemeMeta['shell-theme'];
                } catch (e) {
                    global.logError( _("Failed to parse") + " theme.json: " + e);
                    continue;
                }

                // check if theme is disabled. Do not load if disabled. 
                if ( meta['disabled'] && (meta['disabled'] == true )) { continue; }

                // check that all the required properties are there
                // FPM - check that they have actual values?
                let requiredProperties = ['name', 'author', 'version', 'thumbnail'];
                for (let i = 0; i < requiredProperties.length; i++) {
                    let prop = requiredProperties[i];
                    if (!meta[prop]) {
                        global.logError(baseErrorString + _("Missing '") + prop + _("' property in") + "theme.json");
                        continue;
                    }
                }

                // check that the stylesheet exists 
                if ( meta['type'] == "custom" ) {
                    let themeFile = themeDir.get_child(DEFAULT_STYLESHEET);
                    if (!themeFile.query_exists(null)) {
                       global.logError(baseErrorString + _("Missing stylesheet: ") + DEFAULT_STYLESHEET );
                       continue;
                    }
                }

                // optional shell and gjs version tests 
                if (meta['shell-version'] && !this._versionCheck(meta['shell-version'], Config.PACKAGE_VERSION) ||
                   (meta['js-version'] && !this._versionCheck(meta['js-version'], Config.GJS_VERSION))) {
                       global.logError(baseErrorString + _("theme not compatible with shell and/or GJS version"));
                   continue;
                }

                // store what is needed for later use
                let metadata = { 'name': null, 'author': null, 
                                 'version': null, 'thumbnail': null, 'stylesheet': null };
                metadata['name'] = meta['name'];
                metadata['author'] = meta['author'];
                metadata['version'] = meta['version'];
                metadata['thumbnail'] = dirName + '/' + name + '/gnome-shell/' + meta['thumbnail'];
                if ( meta['type'] == 'custom' ) {
                    metadata['stylesheet'] = dirName + '/' + name + '/gnome-shell/' + DEFAULT_STYLESHEET;
                }

                retThemes.push(metadata['name']);
                this._themes.push(metadata);
            }
        }
        return retThemes;
    },

    // copied from GNOME Shell's extensionSystem.js
    _versionCheck: function(required, current) {
        let currentArray = current.split('.');
        let major = currentArray[0];
        let minor = currentArray[1];
        let point = currentArray[2];

        for (let i = 0; i < required.length; i++) {
            let requiredArray = required[i].split('.');
            if (requiredArray[0] == major && requiredArray[1] == minor && (requiredArray[2] == point ||
                (requiredArray[2] == undefined && parseInt(minor) % 2 == 0))) {
                return true;
            }
        }
        return false;
    }

};


function main(extensionMeta)
{
    // first check that the user-theme extension schema exists!
    let settings = new Gio.Settings({ schema: GSETTINGS_SCHEMA });
    if (!settings) {
        global.logError( _("Cannot load extension. Missing ") + GSETTINGS_SCHEMA + _(" schema") );
        return;
    }

    // load the appropriate message catalog if found
    let userExtensionLocalePath = extensionMeta.path + '/locale';
    Gettext.bindtextdomain("themeselector", userExtensionLocalePath);
    Gettext.textdomain("themeselector");

    new ThemeSelector();
}
