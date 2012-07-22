#!/usr/bin/perl
use 5.014;
use Plack::Request;
use Plack::Builder;
use Plack::Session;
use Plack::Session::Store::File;
use Plack::Session::State::Cookie;
use File::Slurp 'slurp';
use lib 'lib';
use DBI;
use utf8;
use JSON;
use Forward::Routes;
use Class::Load 'load_class';

#conf
my $devel = 1;
my $extjs_path = 'static/extjs';

sub get_db {
	state $dbh = DBI->connect("dbi:Pg:dbname=whist", 'pgsql', '');
	$dbh->{pg_enable_utf8} = 1;
	return $dbh;
}

my $app = sub {
	my ($env) = @_;
	my $req = Plack::Request->new($env);
	my $session = Plack::Session->new($env);

	if (!$session->get('game')) {
		my $id = get_db()->selectrow_array('SELECT max(id) FROM game');
		$session->set('game', $id);
	}

	my $routes = Forward::Routes->new;

	$routes->add_route('/favicon.ico')->to('#r404');

	$routes->add_route('/service/new/game')->to('#new_game')->via('get');

	$routes->add_route('/')->to('Index#default');
	$routes->add_route('/service/round')->to('Round#insert')->via('post');
	$routes->add_route('/service/round')->to('Round#get')->via('get');
	$routes->add_route('/service/del_round')->to('Round#delete')->via('post');

	my $ret = call_match($req, $routes, $session, get_db());

	return $ret if $ret;

	return [ 200, [ 'Content-Type' => 'text/html', 'charset' => 'utf-8' ], [ 'xxx' ] ];
};

sub r404 {
	return [ 404, [ 'Content-Type' => 'text/plain' ], ['File not found'] ];
}

sub return_json {
	my ($data) = @_;
	return [ 200, [ 'Content-Type' => 'application/json', 'charset' => 'utf-8' ], [ encode_json($data) ] ];
}

sub new_game {
	my ($args) = @_;

	my $db = $args->{db};

	my ($game_id) = $db->selectrow_array(' INSERT INTO game DEFAULT VALUES RETURNING id');

	$args->{session}->set('game', $game_id);

	return return_json({ game_id => $game_id});
}

sub call_match {
	my ($req, $routes, $session, $db) = @_;

	my $matches = $routes->match($req->method => $req->path_info);

	return unless $matches->[0];

	foreach my $match (@$matches) {
		my ($class, $sub) = ($match->class, $match->action);

		my $to_pass = { match => $match, session => $session, req => $req, db => $db };

		my $ret;
		if ($class) {
			load_class($class) or die "Couldn't load $class $!";

			$ret = $class->$sub($to_pass);
		}
		else {
			$class //= caller;
			$sub = $class->can($sub);
			$ret = $sub->($to_pass);
		}

		return $ret if $ret;
	}
}

builder {
	my $state = Plack::Session::State::Cookie->new(httponly => 1);
	enable 'Session', state => $state;

	mount "/static" => builder {
		enable 'Plack::Middleware::ConditionalGET';
		enable 'Expires', content_type => [ 'text/css', 'application/javascript', qr!^image/! ], expires => 'now plus 6 months';
		enable 'Plack::Middleware::ETag';
		enable 'Plack::Middleware::ContentLength';
	#	enable "Auth::Basic", authenticator => \&auth;

		if ($devel) {
			enable "File::Sass", syntax => "scss";
			enable 'Plack::Middleware::Static', path => sub { s!^/extjs!! }, root => $extjs_path;
		}
		else {
			enable 'Plack::Middleware::Precompressed', match => qr!\.(?:cs|j)s\z!;
			enable 'Plack::Middleware::Static', path => sub { qr!^(/resources/)! }, root => $extjs_path;
		}
		enable 'Plack::Middleware::Static', path => sub { qr/^(?:img|script|style)/ }, root => 'static';

		$app;
	};

	mount '/' => builder {
		$app;
	};
};
