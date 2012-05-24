
devel:
	plackup -r -R ../lib whist.pl

run:
		./whist.pl daemon --reload
#		hypnotoad f1bets.pl

edit:
	mvim whist.pl static/*/*.[cj]s* -c ':vsplit' -c ':wincmd w'

db: .PHONY
	psql whist < db/whist.sql
