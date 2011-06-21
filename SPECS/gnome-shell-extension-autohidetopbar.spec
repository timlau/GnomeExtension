%global uuid autohidetopbar@fpmurphy.com
%global shortname autohidetopbar

Name:           gnome-shell-extension-%{shortname}
Version:        1.0
Release:        1%{?dist}
Summary:        A gnome-shell extension for auto hide the topbar

Group:          User Interface/Desktops
License:        GPLv2
URL:            http://www.fpmurphy.com/gnome-shell-extensions/
Source0:        http://www.fpmurphy.com/gnome-shell-extensions/%{shortname}-%{version}.tar.gz
BuildArch:      noarch

Requires:       gnome-shell >= 3.0.1


%description
This extension autohides the topbar.
Double click on the topbar to turn auto hide on/off


%prep
%setup -q -n %{uuid}


%build
# Nothing to build


%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
install -Dp -m 0644 {extension.js,metadata.json} \
  %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/


%files
%defattr(-,root,root,-)
%doc README
%{_datadir}/gnome-shell/extensions/%{uuid}/


%changelog
* Sun Jun 12 2011 Tim Lauridsen <timlau@fedoraproject.org> - 1.0-1
- Initial package for Fedora
