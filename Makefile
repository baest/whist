
devel:
	plackup -r -R ../lib whist.pl

run:
		starman whist.pl

edit:
	mvim whist.pl static/*/*.[cj]s* -c ':vsplit' -c ':wincmd w'

db: .PHONY
	psql whist < db/whist.sql
