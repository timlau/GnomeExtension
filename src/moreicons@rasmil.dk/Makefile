PKGNAME = moreicons
VERSION = $(shell awk '/Version:/ { print $$2 }' gnome-shell-extension-${PKGNAME}.spec)
DATADIR = /usr/share
UUID    = $(PKGNAME)@rasmil.dk

all: .PHONY

clean:
	@rm -rf *~ *.tar.gz *.rpm

install:
	mkdir -p $(DESTDIR)$(DATADIR)/gnome-shell/extensions/$(UUID)
	mkdir -p $(DESTDIR)$(DATADIR)/glib-2.0/schemas
	install -Dp -m 0644 {extension.js,metadata.json} \
						$(DESTDIR)$(DATADIR)/gnome-shell/extensions/$(UUID)/
	install -Dp -m 0644 data/org.gnome.shell.extensions.more-icons.gschema.xml \
						$(DESTDIR)$(DATADIR)/glib-2.0/schemas/  

archive:
	@rm -rf ${PKGNAME}-${VERSION}.tar.gz
	@rm -rf /tmp/${PKGNAME}-$(VERSION) /tmp/${PKGNAME}
	@dir=$$PWD; cd /tmp; cp -a "$$dir" ${PKGNAME}
	@mv /tmp/${PKGNAME} /tmp/${PKGNAME}-$(VERSION)
	@dir=$$PWD; cd /tmp; tar cvzf "$$dir/${PKGNAME}-$(VERSION).tar.gz" ${PKGNAME}-$(VERSION)
	@rm -rf /tmp/${PKGNAME}-$(VERSION)	
	@cp ${PKGNAME}-$(VERSION).tar.gz $(shell rpm -E '%_sourcedir')
	@echo "The archive is in ${PKGNAME}-$(VERSION).tar.gz"

rpm:
	@$(MAKE) archive
	@rpmbuild -ba gnome-shell-extension-${PKGNAME}.spec



