# Maintainer: Iván Zaera Avellón <izaera@gmx.es>
pkgname=joshi
pkgdesc="JavaScript Oriented Shell Interpreter"
pkgver=0.1
pkgrel=1
arch=('any')
url="https://github.com/izaera/joshi"
license=('GPL3')
#depends=()
#optdepends=()
makedepends=(
	'curl'
	'gcc'
	'make'
)
# backup=()
#install=joshi.install

#FILES=$(git ls-tree -r master --full-tree --name-only)
#echo $FILES > /tmp/kk
#source=($FILES)

# noextract=("${source[@]%%::*}")
# md5sums=()
# validpgpkeys=()

pkgver() {
	# Git, tags available
	# printf "%s" "$(git describe --long | sed 's/\([^-]*-\)g/r\1/;s/-/./g')"

	# Git, no tags available
	# printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
	echo "0.1"
}

package() {
	cd $srcdir
	
	mkdir -p $pkgdir/usr/bin
	cp -a joshi $pkgdir/usr/bin

	mkdir -p $pkgdir/usr/lib/joshi
	cp -aR js/* $pkgdir/usr/lib/joshi

	mkdir -p $pkgdir/usr/include/joshi
	cp -aR src/duktape/*.h $pkgdir/usr/include/joshi
}
