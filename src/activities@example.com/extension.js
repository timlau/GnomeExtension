const St = imports.gi.St;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;

function main() {

   hotSpotButton = Main.panel.button;

   let logo = new St.Icon({ icon_type: St.IconType.FULLCOLOR,
                                      icon_size: hotSpotButton.height, icon_name: 'fedora-logo-icon' });
   let box = new St.BoxLayout();
   box.add_actor(logo);

   hotSpotButton.set_child(box);
}
