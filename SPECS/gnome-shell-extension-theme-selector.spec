%global uuid themeselector@fpmurphy.com


Name:           gnome-shell-extension-theme-selector
Version:        0.9
Release:        3%{?dist}
Summary:        Gnome shell user theme selector 
Group:          User Interface/Desktops     

License:        GPLv2+
URL:            http://blog.fpmurphy.com/2011/04/gnome-shell-theme-selector-preview.html
Source0:        http://www.fpmurphy.com/gnome-shell-extensions/themeselector-%{version}.tar.gz
# 5 columns to show more themes
Patch0:         5-columns.patch
# Show system wide themes (/usr/share/themes/<ThemeName>/gnome-shell/)
Patch1:         system-wide-themes.patch

Requires:       gnome-shell-extensions-user-theme
Requires:       gnome-shell >= 3.0.1
BuildArch:      noarch

%description
Gnome shell user theme selector with preview

%prep
%setup -q -c 
%patch0 -p1
%patch1 -p1


%install
rm -rf %{buildroot}
mkdir -p -m755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
install -Dp -m 0644 {extension.js,metadata.json} \
  %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
  
# Install preview & theme metadata for Gnome3 default theme Adwaita so it can be selected.
mkdir -p -m755 %{buildroot}%{_datadir}/themes/Adwaita/gnome-shell  
install -Dp -m 0644 Adwaita/gnome-shell/{theme.json,preview-adwaita.png} \
  %{buildroot}%{_datadir}/themes/Adwaita/gnome-shell 

%files
%doc README
%{_datadir}/gnome-shell/extensions/%{uuid}/
%{_datadir}/themes/Adwaita/gnome-shell/

%changelog
* Sat Jun 11 2011 Tim Lauridsen <timlau@fedoraproject.org> 0.9-3
- Install preview & theme metadata for Gnome3 default theme Adwaita so it can be selected.

* Thu Jun 9 2011 Tim Lauridsen <timlau@fedoraproject.org> 0.9-2
- remove themes and theme install helper
- Added patch to show 5 columns of theme previews.
- Added patch to support system wide themes

* Sat May 14 2011 Tim Lauridsen <timlau@fedoraproject.org> 0.9-1
- initial rpm build
