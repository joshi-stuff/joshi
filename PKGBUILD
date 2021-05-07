# Maintainer: Iván Zaera Avellón <izaera at gmx dot es>
pkgname=joshi
pkgdesc="JavaScript Oriented Shell Interpreter"
pkgver=1.5.0
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
	'nodejs'
	'python2'
	'sed'
)

pkgver() {
	git describe --tags	| sed -e 's/-/\./g'
}

build() {
	cd "$srcdir"
	make clean
	make compile docs
}

package() {
	cd "$srcdir"
	PREFIX="$pkgdir/usr" make install
}
