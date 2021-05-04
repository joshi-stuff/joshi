# Maintainer: Iván Zaera Avellón <izaera@gmx.es>
pkgname=joshi
pkgdesc="JavaScript Oriented Shell Interpreter"
pkgver=1.4.1.54.ga9f7cf4
pkgrel=1
arch=('any')
url="https://github.com/izaera/joshi"
license=('GPL3')
depends=(
	'glibc'
	'libxcrypt'
)
optdepends=(
	'ncurses: terminal support'
)
makedepends=(
	'binutils'
	'coreutils'
	'curl'
	'gcc'
	'git'
	'make'
	'python2'
	'sed'
)

pkgver() {
	git describe --tags	| sed -e 's/-/\./g'
}

build() {
	cd "$srcdir"
	make clean
	make
}

package() {
	cd "$srcdir/dist"
	
	cp -aR * "$pkgdir"
}
