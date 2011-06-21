//   Copyright (C) 2011 Tim Lauridsen < tla<AT>rasmil<DOT>dk >
//
//    This program is free software; you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation; either version 2 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program; if not, write to the Free Software
//    Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

const Gio = imports.gi.Gio;
const Panel = imports.ui.panel;
const StatusIconDispatcher = imports.ui.statusIconDispatcher;

const GSETTINGS_SCHEMA = 'org.gnome.shell.extensions.more-icons';
const GSETTINGS_THEME_KEY = 'icons';

function main() {

    // Add the notification(s) you want display on the top bar
    // - one per line. Use the english text string displayed when
    // hovering your mouse over the bottom right notification area
    var settings = new Gio.Settings({ schema: GSETTINGS_SCHEMA });
    if (!settings) {
        global.logError( _("Cannot load extension. Missing ") + GSETTINGS_SCHEMA + _(" schema") );
        return;
    }
    var enabledIcons = settings.get_strv(GSETTINGS_THEME_KEY);
    for (let i = 0; i <enabledIcons.length; i++) {
        let icon = enabledIcons[i];
        global.log("Adding status icon for "+icon);
        StatusIconDispatcher.STANDARD_TRAY_ICON_IMPLEMENTATIONS[icon] = icon;
    }

}
