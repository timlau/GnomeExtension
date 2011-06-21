%global uuid moreicons@rasmil.dk
%global shortname moreicons

Name:           gnome-shell-extension-%{shortname}
Version:        1.0
Release:        1%{?dist}
Summary:        A gnome-shell extension for adding extra icons to statusbar

Group:          User Interface/Desktops
License:        GPLv2+
URL:            http://rasmil.dk/gnome-shell-extensions/
Source0:        http://rasmil.dk/gnome-shell-extensions/%{shortname}-%{version}.tar.gz
BuildArch:      noarch

Requires:       gnome-shell >= 3.0.1


%description
This extention add non gnome3 icons like gnote etc. to statusbar


%prep
%setup -q -n %{shortname}-%{version}


%build
# Nothing to build


%install
rm -rf %{buildroot}
make DESTDIR=$RPM_BUILD_ROOT install

%files
%defattr(-,root,root,-)
%doc README COPYING
%{_datadir}/gnome-shell/extensions/%{uuid}/
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.more-icons.gschema.xml

%posttrans
glib-compile-schemas --allow-any-name %{_datadir}/glib-2.0/schemas || :

%postun
glib-compile-schemas %{_datadir}/glib-2.0/schemas &> /dev/null || :

%changelog
* Thu Jun 16 2011 Tim Lauridsen <timlau@fedoraproject.org> - 1.0-1
- Initial package for Fedora
